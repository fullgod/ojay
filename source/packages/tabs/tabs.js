/**
 * <p>The <tt>Tabs</tt> class is used to convert a list of document sections into a tabbed
 * interface. Each section should contain a heading or similar common element whose content
 * will be used as the text label for each tab.</p>
 *
 * <p>For example, the following starting markup:</p>
 *
 * <pre><code>    <div id="tabGroup">
 *         <div class="tab">
 *             <h3 class="toggle">J.G. Ballard</h3>
 *             <p>I believe in the power of the imagination to remake the
 *             world, to release the truth within us, to hold back the night...</p>
 *         </div>
 *         <div class="tab">
 *             <h3 class="toggle">Andrei Tarkovsky</h3>
 *             <p><q>We do not move in one direction, rather do we wander back and
 *             forth, turning now this way and now that. We go back on our own...</p>
 *         </div>
 *         <div class="tab">
 *             <h3 class="toggle">Philip K. Dick</h3>
 *             <p>I ask in my writing, What is real? Because unceasingly we
 *             are bombarded with pseudo-realities manufactured...</p>
 *         </div>
 *     </div></code></pre>
 *
 * <p>and the following script snippet:</p>
 *
 * <pre><code>    var tabs = Ojay.Tabs('#tabGroup .tab');
 *     tabs.setup();</code></pre>
 *
 * <p>the markup is transformed into:</p>
 *
 * <pre><code>    <ul class="toggles">
 *         <li class="toggle-1 first">J.G. Ballard</li>
 *         <li class="toggle-2">Andrei Tarkovsky</li>
 *         <li class="toggle-3 last">Philip K. Dick</li>
 *     </ul>
 *     <div id="tabGroup">
 *         <div class="tab">
 *             <p>I believe in the power of the imagination to remake the
 *             world, to release the truth within us, to hold back the night...</p>
 *         </div>
 *         <div class="tab">
 *             <p><q>We do not move in one direction, rather do we wander back and
 *             forth, turning now this way and now that. We go back on our own...</p>
 *         </div>
 *         <div class="tab">
 *             <p>I ask in my writing, What is real? Because unceasingly we
 *             are bombarded with pseudo-realities manufactured...</p>
 *         </div>
 *     </div></code></pre>
 *
 * @constructor
 * @class Tabs
 */
Ojay.Tabs = new JS.Class('Ojay.Tabs', /** @scope Ojay.Tabs.prototype */{
    include: [Ojay.Observable, JS.State],
      
    /**
     * <p>To initialize, <tt>Tabs</tt> requires a CSS selector to get the list of page
     * sections to convert to tabs, and optionally an options object. Available options
     * are:</p>
     *
     * <ul>
     *     <li><tt>toggleSelector</tt> - CSS selector used to get toggle elements
     *     <li><tt>togglesClass</tt> - class name added to the generated list of toggles
     *     <li><tt>togglesPosition</tt> - 'before' or 'after', position to insert toggles list
     *     <li><tt>switchTime</tt> - duration of tab switch animation in seconds
     * </ul>
     *
     * @param {String} tabs
     * @param {Object} options
     */
    initialize: function(tabs, options) {
        this._tabGroup = tabs;
        options  = options || {};
        
        options.toggleSelector  = options.toggleSelector  || this.klass.TOGGLE_SELECTOR;
        options.togglesClass    = options.togglesClass    || this.klass.TOGGLES_CLASS;
        options.switchTime      = options.switchTime      || this.klass.SWITCH_TIME;
        options.togglesPosition = options.togglesPosition || this.klass.INSERT_POSITION;
        this._options = options;
        
        this.setState('CREATED');
    },
    
    /**
     * @returns {Object}
     */
    getInitialState: function() {
        return {tab: 1};
    },
    
    /**
     * @param {Object} state
     * @param {Object} options
     * @returns {Tabs}
     */
    changeState: function(state, options) {
        if (state.tab !== undefined) this._handleSetPage(state.tab, options);
        return this;
    },
    
    states: {
        /**
         * <p>The <tt>Tabs</tt> instance is in the CREATED state until its <tt>setup()</tt>
         * method is called.</p>
         */
        CREATED: /** @scope Ojay.Tabs.prototype */{
            /**
             * <p>Sets up all the DOM changes the <tt>Tabs</tt> object needs. If you want to history
             * manage the object, make sure you set up history management before calling this method.
             * Moves the object to the READY state if successful.</p>
             * @returns {Tabs}
             */
            setup: function() {
                this._tabGroup  = Ojay(this._tabGroup);
                this._container = this._tabGroup.parents().at(0);
                
                this._makeToggles();
                this._makeViews();
                this._restoreState();
                
                return this;
            },
            
            /**
             * <p>Insert the toggle control group before or after the tabs' containing
             * element.</p>
             */
            _makeToggles: function() {
                this._toggles = [];
                var self = this, options = self._options;
                
                var toggles = Ojay( Ojay.HTML.ul({className: options.togglesClass}, function (HTML) {
                    self._tabGroup.children(options.toggleSelector).forEach(function(header, i) {
                        var toggle = Ojay( HTML.li() ).addClass('toggle-' + (i+1));
                        toggle.setContent(header.node.innerHTML);
                        if (i === 0) toggle.addClass('first');
                        if (i === self._tabGroup.length - 1) toggle.addClass('last');
                        self._toggles.push(toggle);
                        header.remove();
                        toggle.on('click')._(self).setPage(i+1);
                    });
                }) );
                
                if (typeof this._options.width != 'undefined')
                    toggles.setStyle({width: this._options.width});
                
                this._tabGroup.parents().at(0).insert(toggles, this._options.togglesPosition);
            },
            
            _makeViews: function() {
                var self = this, options = self._options;
                
                this._tabs = this._tabGroup.map(function(container) {
                    return new this.klass.Tab(this, container);
                }, this);
                
                if (options.width && options.height)
                    this._container.setStyle({height: options.height});
            },
            
            _restoreState: function() {
                this.setState('READY');
                var state = this.getInitialState();
                this._handleSetPage(state.tab);
                
                this.on('pagechange', function(tabs, page) {
                    tabs._highlightToggle(page - 1);
                });
            }
        },
        
        /**
         * <p>The <tt>Tabs</tt> object is in the READY state when all its DOM behaviour has been
         * set up and it is not in the process of switching tabs.</p>
         */
        READY: /** @scope Ojay.Tabs.prototype */{
            /**
             * <p>Switches the set of tabs to the given page (indexed from 1), inserting
             * history entry. Passing in the <tt>silent</tt> option will stop the
             * <tt>pagechange</tt> event from being published.</p>
             * @param {Number} page
             * @param {Object} options
             * @returns {Tabs}
             */
            setPage: function(page, options) {
                this.changeState({tab: page}, options);
                return this;
            },
            
            /**
             * <p>Switch to the tab with the index provided as the first argument.</p>
             * @param {Number} index
             * @param {Object} options
             */
            _handleSetPage: function(index, options) {
                index -= 1;
                
                if (index >= this._tabs.length) index = 0;
                if (this._currentTab == index) return;
                
                if ((options || {}).silent !== false) this.notifyObservers('pagechange', index+1);
                
                if (typeof this._currentTab == 'undefined') {
                    this._currentTab = index;
                    this._tabs[index].show();
                    this._highlightToggle(index);
                } else {
                    this.setState('ANIMATING');
                    this._tabs[this._currentTab].hide()._(function(self) {
                        self._currentTab = index;
                        self._tabs[index].show()
                        ._(self).setState('READY');
                    }, this);
                }
            },
            
            /**
             * <p>Sets the 'selected' class on the appropriate toggle.</p>
             * @param {Number} index
             */
            _highlightToggle: function(index) {
                this._toggles.forEach({removeClass: 'selected'});
                this._toggles[index].addClass('selected');
            }
        },
        
        /**
         * <p>The <tt>Tabs</tt> instance is in the ANIMATING state during tab transitions.</p>
         */
        ANIMATING: /** @scope Ojay.Tabs.prototype */{}
    },
    
    extend: /** @scope Ojay.Tabs */{
        TOGGLE_SELECTOR:  '.toggle',
        TOGGLES_CLASS:    'toggles',
        SWITCH_TIME:      0.2,
        INSERT_POSITION:  'before',
        
        /**
         * @constructor
         * @class Tab
         */
        Tab: new JS.Class('Ojay.Tabs.Tab', /** @scope Ojay.Tabs.Tab.prototype */{
            /**
             * @param {Ojay.Tab} group
             * @param {HTMLElement} container
             */
            initialize: function(group, container) {
                this._container = container, this._group = group;
                
                this._container.hide().setStyle({opacity: 0});
                
                if (this._group._options.height)
                    this._container.setStyle({position: 'absolute', top: 0, left: 0});
            },
            
            /**
             * @returns {JS.MethodChain}
             */
            hide: function() {
                return this._container.animate({opacity: {to: 0}},
                        this._group._options.switchTime)
                        .hide()
                        ._(this);
            },
            
            /**
             * @returns {JS.MethodChain}
             */
            show: function() {
                return this._container.show().animate({opacity: {to: 1}},
                        this._group._options.switchTime)
                        ._(this);
            }
        })
    }
});

