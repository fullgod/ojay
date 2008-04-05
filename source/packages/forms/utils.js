JS.extend(Ojay, /** @scope Ojay */ {
    /**
     * <p>Returns <tt>true</tt> iff the given value is truthy and is not just whitespace.</p>
     * @param {String} value
     * @returns {Boolean}
     */
    isBlank: function(value) {
        return value ? false : (String(value).trim() == '');
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given <tt>value</tt> is a number.</p>
     * @param {String} value
     * @returns {Boolean}
     */
    isNumeric: function(value) {
        return this.NUMBER_FORMAT.test(String(value));
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given <tt>value</tt> is an email address.</p>
     * @param {String} value
     * @returns {Boolean}
     */
    isEmailAddress: function(value) {
        return this.EMAIL_FORMAT.test(String(value));
    },
    
    /**
     * <p>JSON number definition from http://json.org</p>
     */
    NUMBER_FORMAT: /^\-?(0|[1-9]\d*)(\.\d+)?(e[\+\-]?\d+)?$/i,
    
    /**
     * <p>Format for valid email addresses from http://www.regular-expressions.info/email.html</p>
     */
    EMAIL_FORMAT: /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b$/i
});

Ojay.Forms = function(description) {
    description.call(DSL);
};

/**
 * <p>Returns an Ojay collection wrapping the label for the given input.</p>
 * @param {String|HTMLElement|DomCollection} input
 * @returns {DomCollection}
 */
Ojay.Forms.getLabel = function(input) {
    input = Ojay(input);
    if (!input.node) return Ojay();
    var label = input.ancestors('label');
    if (label.node) return label.at(0);
    var id = input.node.id;
    label = [].filter.call(document.getElementsByTagName('label'), function(label) { return id && label.htmlFor == id; });
    return Ojay(label.slice(0,1));
};

/**
 * <p>Returns the serialization of the given <tt>form</tt> as a string.</p>
 * @param {String|HTMLElement|DomCollection} form
 * @returns {String}
 */
Ojay.Forms.getQueryString = function(form) {
    var data = YAHOO.util.Connect.setForm(Ojay(form).node);
    YAHOO.util.Connect.resetFormState();
    return data;
};

/**
 * <p>Returns the serialization of the given <tt>form</tt> as an object.</p>
 * @param {String|HTMLElement|DomCollection} form
 * @returns {Object}
 */
Ojay.Forms.getData = function(form) {
    return this.getQueryString(form).split('&').reduce(function(memo, pair) {
        var data = pair.split('=').map(decodeURIComponent);
        memo[data[0].trim()] = data[1].trim();
        return memo;
    }, {});
};