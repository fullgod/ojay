Ojay.Accordion.extend(/** @scope Ojay.Accordion */{
    /**
     * <p>The <tt>Accordion.Section</tt> class models a single collapsible section within an
     * accordion menu. Only one section of an accordion may be open at any time. Ojay supports
     * both vertical and horizontal accordions; these have different methods for size calculations
     * and are implemented as subclasses. This class should be considered abstract.</p>
     * @constructor
     * @class Accordion.Section
     */
    Section: new JS.Class('Ojay.Accordion.Section', /** @scope Ojay.Accordion.Section.prototype */{
        include: Ojay.Observable,
        
        extend: /** @scope Ojay.Accordion.Section */{
            SECTION_CLASS:      'accordion-section',
            COLLAPSER_CLASS:    'accordion-collapsible',
            DEFAULT_EVENT:      'click',
            DEFAULT_DURATION:   0.4,
            DEFAULT_EASING:     'easeBoth'
        },
        
        /**
         * <p>To instantiate a section, pass in an <tt>Accordion</tt> instance, the section's
         * container element, and an element within the container that should be collapsible.
         * The final argument sets configuration options, passed through from the <tt>Accordion</tt>
         * constructor.</p>
         * @param {Accordion} accordion
         * @param {Number} index
         * @param {DomCollection} element
         * @param {String} collapsible
         * @param {Object} options
         */
        initialize: function(accordion, index, element, collapsible, options) {
            this._accordion = accordion;
            this._element = element;
            
            // Restructure the HTML - wrap the collapsing element with a div for resizing,
            // and move the collapsing element outside its original parent (workaround for
            // WebKit layout bug affecting horizontal menus).
            var target = element.descendants(collapsible).at(0);
            this._collapser = Ojay( Ojay.HTML.div({className: this.klass.COLLAPSER_CLASS}) );
            target.insert(this._collapser, 'before');
            this._collapser.insert(target);
            this._element.insert(this._collapser, 'after');
            
            // Fixes some layout issues in IE
            this._collapser.setStyle({position: 'relative', zoom: 1});
            
            options = options || {};
            this._duration = options.duration || this.klass.DEFAULT_DURATION;
            this._easing = options.easing || this.klass.DEFAULT_EASING;
            
            this._element.addClass(this.klass.SECTION_CLASS);
            this._element.on(options.event || this.klass.DEFAULT_EVENT)._(this._accordion).changeState({section: index});
            
            if (options.collapseOnClick)
                this._element.on('click', function() {
                    if (this._open) this.collapse();
                }, this);
            
            this._open = true;
            this.collapse(false);
        },
        
        /**
         * <p>Returns a reference to the outer container element for the section. This element
         * acts as the click target for toggling visibility.</p>
         * @returns {DomCollection}
         */
        getContainer: function() {
            return this._element;
        },
        
        /**
         * <p>Returns a reference to the element that collapses, hiding its content.</p>
         * @returns {DomCollection}
         */
        getCollapser: function() {
            return this._collapser;
        },
        
        /**
         * <p>Causes the section to collapse. Pass the parameter <tt>false</tt> to prevent
         * animation.</p>
         * @param {Boolean} animate
         * @returns {Accordion.Section}
         */
        collapse: function(animate) {
            if (!this._open) return this;
            this._collapser.setStyle({overflow: 'hidden'});
            this._element.removeClass('expanded').addClass('collapsed');
            
            var settings = {};
            settings[this.param] = (animate === false) ? 0 : {to: 0};
            
            var acc = this._accordion;
            if (animate !== false ) this.notifyObservers('collapse');
            
            if (animate === false) {
                this._collapser.setStyle(settings).setStyle({overflow: 'hidden'});
                this._open = false;
                return this;
            } else {
                return this._collapser.animate(settings, this._duration, {easing: this._easing})
                .setStyle({overflow: 'hidden'})
                ._(function(self) { self._open = false; }, this)
                ._(this);
            }
        },
        
        /**
         * <p>Causes the section to expand. Pass the parameter <tt>false</tt> to prevent
         * animation. Any section in the same accordion that is currently open will collapse.</p>
         * @param {Boolean} animate
         * @returns {Accordion.Section}
         */
        expand: function(animate) {
            if (this._open) return this;
            this._accordion._expand(this, animate);
            this._collapser.setStyle({overflow: 'hidden'});
            this._element.addClass('expanded').removeClass('collapsed');
            
            var size = this.getSize(),
                settings = {},
                postAnim = {overflow: ''};
            
            settings[this.param] = (animate === false) ? '' : {to: size};
            postAnim[this.param] = '';
            
            var acc = this._accordion;
            if (animate !== false ) this.notifyObservers('expand');
            
            if (animate === false) {
                this._collapser.setStyle(settings).setStyle({overflow: ''});
                this._open = true;
                return this;
            } else {
                return this._collapser.animate(settings, this._duration, {easing: this._easing})
                .setStyle(postAnim)
                ._(function(self) { self._open = true; }, this)
                ._(this);
            }
        }
    })
});

Ojay.Accordion.extend(/** @scope Ojay.Accordion */{
    /**
     * @constructor
     * @class Ojay.Accordion.HorizontalSection
     */
    HorizontalSection:  new JS.Class('Ojay.Accordion.HorizontalSection', Ojay.Accordion.Section,
    /** @scope Ojay.Accordion.HorizontalSection.prototype */{
        param:  'width',
        
        /**
         * <p>Returns the width of the section at full expansion.</p>
         * @returns {Number}
         */
        getSize: function() {
            var sections = this._accordion.getSections();
            var sizes = sections.map(function(section) {
                var collapser = section._collapser, size = collapser.getRegion().getWidth();
                collapser.setStyle({width: section == this ? '' : 0});
                return size;
            }, this);
            var size = this._collapser.getRegion().getWidth();
            sections.forEach(function(section, i) {
                section._collapser.setStyle({width: sizes[i] + 'px'});
            });
            return size;
        }
    }),
    
    /**
     * @constructor
     * @class Ojay.Accordion.VerticalSection
     */
    VerticalSection:    new JS.Class('Ojay.Accordion.VerticalSection', Ojay.Accordion.Section,
    /** @scope Ojay.Accordion.VerticalSection.prototype */{
        param:  'height',
        
        /**
         * <p>Returns the height of the section at full expansion.</p>
         * @returns {Number}
         */
        getSize: function() {
            if (!this._open) this._collapser.setStyle({height: ''});
            var size = this._collapser.getRegion().getHeight();
            if (!this._open) this._collapser.setStyle({height: 0});
            return size;
        }
    })
});

