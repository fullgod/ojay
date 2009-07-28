/**
 * <p><tt>Accordion</tt> implements the well-known accordion menu widget. It allows for both
 * horizontal and vertical collapse directions, and allows the animation to be configured. Like
 * all Ojay widgets, it comes with a set of events that you can use to couple an accordion
 * instance to other parts of your application.</p>
 *
 * <p>Creating an accordion is straightforward. Start with a list of elements, each of which
 * should contain an element that you want to collapse. For example:</p>
 *
 * <pre><code>    &lt;div class="section"&gt;
 *         &lt;h3&gt;Section 1&lt;/h3&gt;
 *         &lt;p&gt;Lorem ipsum...&lt;/p&gt;
 *     &lt;/div&gt;
 *     &lt;div class="section"&gt;
 *         &lt;h3&gt;Section 2&lt;/h3&gt;
 *         &lt;p&gt;Dolor sit amet...&lt;/p&gt;
 *     &lt;/div&gt;
 *     &lt;div class="section"&gt;
 *         &lt;h3&gt;Section 3&lt;/h3&gt;
 *         &lt;p&gt;Quaniam omnes...&lt;/p&gt;
 *     &lt;/div&gt;</code></pre>
 *
 * <p>In this example, the paragraphs will collapse and the headings will be the menu tabs.
 * The following script sets up the menu:</p>
 *
 * <pre><code>    var acc = new Ojay.Accordion('horizontal',
 *             '.section', 'p');</code></pre>
 *
 * <p>This will make a few changes to the markup, which you'll need to be aware of in order
 * to apply CSS. After the script runs, the document will look like this:</p>
 *
 * <pre><code>    &lt;div class="section accordion-section"&gt;
 *         &lt;h3&gt;Section 1&lt;/h3&gt;
 *     &lt;/div&gt;
 *     &lt;div class="accordion-collapsible"&gt;
 *         &lt;p&gt;Lorem ipsum...&lt;/p&gt;
 *     &lt;/div&gt;
 *     &lt;div class="section accordion-section"&gt;
 *         &lt;h3&gt;Section 2&lt;/h3&gt;
 *     &lt;/div&gt;
 *     &lt;div class="accordion-collapsible"&gt;
 *         &lt;p&gt;Dolor sit amet...&lt;/p&gt;
 *     &lt;/div&gt;
 *     &lt;div class="section accordion-section"&gt;
 *         &lt;h3&gt;Section 3&lt;/h3&gt;
 *     &lt;/div&gt;
 *     &lt;div class="accordion-collapsible"&gt;
 *         &lt;p&gt;Quaniam omnes...&lt;/p&gt;
 *     &lt;/div&gt;</code></pre>
 *
 * <p>The original sections get an additional class to indicate that they're part of an
 * <tt>Accordion</tt> instance, and the collapsible elements get placed inside a new wrapper
 * element, outside their original parent. This seems a little odd but is required to work
 * around a layout bug in WebKit.</p>
        
 * @constructor
 * @class Accordion
 */
Ojay.Accordion = new JS.Class('Ojay.Accordion', /** @scope Ojay.Accordion.prototype */{
    include: Ojay.Observable,
    
    extend: /** @scope Ojay.Accordion */{
        DIRECTIONS: {
            horizontal:     'HorizontalSection',
            vertical:       'VerticalSection'
        }
    },
    
    /**
     * @param {String} direction
     * @param {HTMLElement|String} sections
     * @param {String} collapsible
     * @param {Object} options
     */
    initialize: function(direction, sections, collapsible, options) {
        this._options     = options || {};
        this._direction   = direction;
        this._sections    = sections;
        this._collapsible = collapsible;
    },
    
    /**
     * @returns {Accordion}
     */
    setup: function() {
        var SectionClass = this.klass[this.klass.DIRECTIONS[this._direction]];
        this._sections = Ojay(this._sections).map(function(section, index) {
            var section = new SectionClass(this, index, section, this._collapsible, this._options);
            section.on('expand')._(this).notifyObservers('sectionexpand', index, section);
            section.on('collapse')._(this).notifyObservers('sectioncollapse', index, section);
            return section;
        }, this);
        var state = this.getInitialState();
        this._sections[state.section].expand(false);
        return this;
    },
    
    /**
     * @returns {Object}
     */
    getInitialState: function() {
        return {section: 0};
    },
    
    /**
     * @param {Object} state
     * @returns {Accordion}
     */
    changeState: function(state) {
        this._sections[state.section].expand();
        return this;
    },
    
    /**
     * @param {Accordion.Section} section
     * @param {Boolean} animate
     */
    _expand: function(section, animate) {
        if (this._currentSection) this._currentSection.collapse(animate);
        this._currentSection = section;
    },
    
    /**
     * @returns {Array}
     */
    getSections: function() {
        return this._sections.slice();
    },
    
    /**
     * @param {Number} n
     * @param {Boolean} animate
     * @returns {Accordion}
     */
    expand: function(n, animate) {
        var section = this._sections[n];
        if (section) section.expand(animate);
        return this;
    },
    
    /**
     * @param {Number} n
     * @param {Boolean} animate
     * @returns {Accordion}
     */
    collapse: function(n, animate) {
        var section = this._sections[n];
        if (section) section.collapse(animate);
        return this;
    }
});

