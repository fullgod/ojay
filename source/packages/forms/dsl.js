/**
 * A DSL for describing form requirements. EXPERIMENTAL. Expected usage:
 *
 *     Ojay.Forms(function() { with(this) {
 *  
 *         form('loginForm')
 *             .requires('username')
 *             .requires('password');
 *         
 *         form('addressForm')
 *             .requires('name')
 *             .requires('line1')
 *             .requires('city').toHaveLength({minimum: 3})
 *             .requires('email').toMatch(EMAIL_FORMAT);
 *         
 *         when('addressForm').isValidated(function(errors) {
 *             // Put errors somewhere
 *         });
 *     }});
 */

// Store to hold sets of form rules, entry per page form.
var forms = {};

/**
 * <p>Returns the <tt>FormDescription</tt> for the given <tt>id</tt>. A new description is
 * created if one does not already exist for the <tt>id</tt>.</p>
 * @param {String} id The HTML id of the form
 * @private
 */
var getForm = function(id) {
    return forms[id] || (forms[id] = new FormDescription(id));
};

/**
 * <p>This is the main DSL object for <tt>Ojay.Forms</tt>. It contains methods that should
 * act as top-level functions in the DSL. Do not put a method in here unless it needs to be
 * a top-level function.</p>
 * @private
 */
var DSL = {
    /**
     * <p>Returns a DSL object for describing the form with the given <tt>id</tt>.</p>
     * @param {String} id The id of the form you want to describe
     * @returns {FormDSL}
     */
    form: function(id) {
        return getForm(id).dsl || null;
    },
    
    /**
     * <p>Returns a DSL object for describing the form with the given <tt>id</tt>.</p>
     * @param {String} id The id of the form you want to describe
     * @returns {WhenDSL}
     */
    when: function(id) {
        return getForm(id).when || null;
    },
    
    /**
     * <p>Returns a helper function for use with <tt>when().isValidated()</tt>. The returned
     * function will display the forms elements as a bulleted list inside the element you
     * supply, in a <tt>DIV</tt> with the class name <tt>error-explanation</tt>.</p>
     * @param {String|HTMLElement|DomCollection} element
     * @returns {Function}
     */
    displayErrorsIn: function(element) {
        element = Ojay(element);
        return function(errors) {
            var n = errors.length;
            if (n == 0) return element.setContent('');
            var were = (n == 1) ? 'was' : 'were', s = (n == 1) ? '' : 's';
            element.setContent(Ojay.HTML.div({className: 'error-explanation'}, function(HTML) {
                HTML.p('There ' + were + ' ' + n + ' error' + s + ' with the form:');
                HTML.ul(function(HTML) { errors.forEach(HTML.method('li')); });
            }));
        };
    },
    
    EMAIL_FORMAT: Ojay.Forms.EMAIL_FORMAT
};

/**
 * <p>The <tt>FormDSL</tt> class creates DSL objects used to describe forms. Every
 * <tt>FormDescription</tt> instance has one of these objects that provides DSL-level
 * access to the description.</p>
 * @constructor
 * @class FormDSL
 * @private
 */
var FormDSL = JS.Class({
    /**
     * @param {FormDescription} form
     */
    initialize: function(form) {
        this.form = form;
    },
    
    /**
     * <p>Returns a <tt>RequirementDSL</tt> object used to specify the requirement.</p>
     * @param {String} name
     * @param {String} displayed
     * @returns {RequirementDSL}
     */
    requires: function(name, displayed) {
        var requirement = this.form.getRequirement(name);
        requirement.name = displayed;
        return requirement.dsl;
    }
});

/**
 * <p>The <tt>RequirementDSL</tt> class creates DSL objects used to describe form requirements.
 * All <tt>FormRequirement</tt> objects have one of these objects associated with them.</p>
 * @constructor
 * @class RequirementDSL
 * @private
 */
var RequirementDSL = JS.Class({
    /**
     * @param {FormRequirement} requirement
     */
    initialize: function(requirement) {
        this.requirement = requirement;
    },
    
    /**
     * <p>Specifies that the required field must have a certain length in order to be considered
     * valid. Valid inputs are a number (to specifiy an exact length), or an object with
     * <tt>minimum</tt> and <tt>maximum</tt> fields.</p>
     * @param {Number|Object} options
     * @returns {RequirementDSL}
     */
    toHaveLength: function(options) {
        var min = options.minimum, max = options.maximum;
        this.requirement.add(function(value) {
            if (typeof options == 'number' && value.length != options)
                    return 'must contain exactly ' + options + ' characters';
            if (min !== undefined && value.length < min)
                    return 'must contain at least ' + min + ' characters';
            if (max !== undefined && value.length > max)
                    return 'must contain at most ' + max + ' characters';
            return true;
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must have a certain value in order to be considered
     * valid. Input should be an object with <tt>minimum</tt> and <tt>maximum</tt> fields.</p>
     * @param {Object} options
     * @returns {RequirementDSL}
     */
    toHaveValue: function(options) {
        var min = options.minimum, max = options.maximum;
        this.requirement.add(function(value) {
            if (!Ojay.Forms.isNumeric(value)) return 'must be a number';
            value = Number(value);
            if (min !== undefined && value < min)
                    return 'must be at least ' + min;
            if (max !== undefined && value > max)
                    return 'must be at most ' + max;
            return true;
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must match a given regex in order to be considered
     * valid.</p>
     * @param {Regexp} format
     * @returns {RequirementDSL}
     */
    toMatch: function(format) {
        this.requirement.add(function(value) {
            return format.test(value) || 'is not valid';
        });
        return this;
    },
    
    /**
     * <p>Specifies that the required field must be a number in order to be considered valid.</p>
     * @returns {RequirementDSL}
     */
    toBeNumeric: function() {
        this.requirement.add(function(value) {
            return Ojay.Forms.isNumeric(value) || 'is not a number';
        });
        return this;
    },
    
    /**
     * <p>Provided to allow you to return to the <tt>FormDSL</tt>you want using after entering
     * into using a <tt>RequirementDSL</tt> object.</p>
     * @param {String} name
     * @returns {RequirementDSL}
     */
    requires: function(name) {
        return this.requirement.form.dsl.requires(name);
    }
});

/**
 * <p>The <tt>WhenDSL</tt> class creates DSL objects used to describe form requirements. All
 * <tt>FormRequirement</tt> objects have one of these objects associated with them. The WhenDSL
 * is used specifically to describe events linked to forms.</p>
 * @constructor
 * @class RequirementDSL
 * @private
 */
var WhenDSL = JS.Class({
    /**
     * @param {FormDescription} form
     */
    initialize: function(form) {
        this.form = form;
    },
    
    /**
     * <p>Allows a hook to be registered to say what should be done with the list of error
     * messages when a particular form is validated.</p>
     */
    isValidated: function(block, context) {
        this.form.subscribe(function(form) {
            block.call(context || null, form.errors);
        });
    }
});

var FormDescription = JS.Class({
    include: JS.Observable,
    
    initialize: function(id) {
        this.form = Ojay.byId(id);
        if (!this.hasForm()) return;
        
        this.form.on('submit', this.method('handleSubmission'));
        
        this.requirements = {};
        this.dsl = new FormDSL(this);
        this.when = new WhenDSL(this);
    },
    
    hasForm: function() {
        var node = this.form.node;
        return !!(node && node.tagName.toLowerCase() == 'form');
    },
    
    getRequirement: function(name) {
        return this.requirements[name] || (this.requirements[name] = new FormRequirement(this, name));
    },
    
    handleSubmission: function(form, evnt) {
        if (!this.isValid()) evnt.stopDefault();
    },
    
    getData: function() {
        var data = YAHOO.util.Connect.setForm(this.form.node).split('&').reduce(function(memo, pair) {
            var data = pair.split('=').map(decodeURIComponent);
            memo[data[0].trim()] = data[1].trim();
            return memo;
        }, {});
        YAHOO.util.Connect.resetFormState();
        return data;
    },
    
    validate: function() {
        var data = this.getData(), key, requirement, errors = [], result;
        for (key in data) {
            requirement = this.requirements[key];
            if (!requirement) continue;
            result = requirement.test(data[key]);
            if (result !== true) errors = errors.concat(result);
            requirement.setValid(result === true);
        }
        this.errors = errors;
        this.notifyObservers(this);
    },
    
    isValid: function() {
        this.validate();
        return this.errors.length === 0;
    }
});

var isPresent = function(value) {
    return Ojay.Forms.isPresent(value) || 'is required';
};

var FormRequirement = JS.Class({
    initialize: function(form, field) {
        this.form = form;
        this.field = field;
        this.tests = [];
        this.dsl = new RequirementDSL(this);
        
        this.elements = this.form.form.descendants(['input', 'textarea', 'select'].map(function(tagName) {
            return tagName + '[name=' + field + ']';
        }).join(', '));
        
        var id;
        this.label = (id = (this.elements.node || {}).id)
                ? Ojay('label').filter(function(l) { return l.node.htmlFor == id; })
                : null;
    },
    
    getName: function() {
        var name = this.name || (this.label ? this.label.node.innerHTML.stripTags() : this.field);
        return name.charAt(0).toUpperCase() + name.substring(1);
    },
    
    add: function(block) {
        this.tests.push(block);
    },
    
    test: function(value) {
        var errors = [], tests = this.tests.length ? this.tests : [isPresent];
        tests.forEach(function(block) {
            var result = block(value);
            if (result !== true) errors.push(this.getName() + ' ' + result);
        }, this);
        return errors.length ? errors : true;
    }.traced('test()'),
    
    setValid: function(valid) {
        this.elements[valid === true ? 'removeClass' : 'addClass']('invalid');
    }
});