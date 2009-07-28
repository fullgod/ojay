/**
 * @class AjaxTabs
 * @constructor
 */
Ojay.AjaxTabs = new JS.Class('Ojay.AjaxTabs', Ojay.Tabs, /** @scope Ojay.AjaxTabs.prototype */{
    
    /**
     * <p><tt>AjaxTabs</tt> takes slightly different initialization data to <tt>Tabs</tt>.
     * This class requires two compulsory arguments. The first is a list of link elements
     * (or a CSS selector for same); these links will become the toggles for the tab group.
     * The second is an element into which to insert the content retrieved by the Ajax
     * requests.</p>
     * @param {String|DomCollection} links
     * @param {String|DomCollection} container
     * @param {Object} options
     */
    initialize: function(links, container, options) {
        this.callSuper(links, options);
        this._container = container;
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the given page is already loaded.</p>
     * @param {Number} index
     * @returns {Boolean}
     */
    pageLoaded: function(index) {
        return !!this._loaded[index - 1];
    },
    
    /**
     * <p>Tells the <tt>AjaxTabs</tt> to load the content for the given page, if
     * the content is not already loaded. Fires <tt>pagerequest</tt> and
     * <tt>pageload</tt> events.</p>
     * @param {Number} page
     * @param {Function} callback
     * @param {Object} scope
     * @returns {AjaxTabs}
     */
    loadPage: function(page, callback, scope) {
        if (this.pageLoaded(page) || this.inState('CREATED')) return this;
        var url = this._links[page - 1].href, self = this;
        this.notifyObservers('pagerequest', url);
        Ojay.HTTP.GET(url, {}, {
            onSuccess: function(response) {
                response.insertInto(self._tabGroup[page - 1]);
                self._loaded[page - 1] = true;
                self.notifyObservers('pageload', url, response);
                if (typeof callback == 'function') callback.call(scope || null);
            }
        });
        return this;
    },
    
    states: {
        CREATED: {
            /**
             * <p>Sets up all the DOM changes the <tt>Tabs</tt> object needs. If you want to history
             * manage the object, make sure you set up history management before calling this method.
             * Moves the object to the READY state if successful.</p>
             * @returns {Tabs}
             */
            setup: function() {
                this._links = Ojay(this._tabGroup);
                this._loaded = this._links.map(function() { return false; });
                this._container = Ojay(this._container);
                
                this._makeToggles();
                this._makeViews();
                this._restoreState();
                
                return this;
            },
            
            /**
             * <p>Sets up the links as toggles to control tab visibility.</p>
             */
            _makeToggles: function() {
                this._toggles = [];
                this._links.forEach(function(link, i) {
                    link.addClass('toggle-' + (i+1));
                    if (i === 0) link.addClass('first');
                    if (i === this._links.length - 1) link.addClass('last');
                    this._toggles.push(link);
                    link.on('click', Ojay.stopDefault)._(this).setPage(i+1);
                }, this);
            },
            
            /**
             * <p>Generates a set of elements to hold the content retrieved over Ajax
             * when the links are clicked.</p>
             */
            _makeViews: function() {
                this._container.setContent('');
                this._links.forEach(function(link, i) {
                    var div = Ojay.HTML.div({className: this.klass.TAB_CLASS});
                    this._container.insert(div);
                }, this);
                this._tabGroup = this._container.children();
                this.callSuper();
            }
        },
        
        READY: {
            /**
             * <p>Handles request to <tt>changeState()</tt>.</p>
             * @param {Number} page
             */
            _handleSetPage: function(index) {
                if (this.pageLoaded(index)) return this.callSuper();
                
                var _super = this.method('callSuper');
                this.setState('REQUESTING');
                this.loadPage(index, function() {
                    this.setState('READY');
                    _super();
                }, this);
            }
        },
        
        REQUESTING: {}
    },
    
    extend: /** @scope Ojay.AjaxTabs */{
        TAB_CLASS:    'tab',
        
        /**
         * <p>There's a pretty good chance of there being several good ways of instantiating
         * one of these, so for now let's encourage the default way to be used through a
         * factory method.</p>
         * @param {String|DomCollection} links
         * @param {String|DomCollection} container
         * @param {Object} options
         * @returns {AjaxTabs}
         */
        fromLinks: function(links, container, options) {
            return new this(links, container, options);
        }
    }
});

