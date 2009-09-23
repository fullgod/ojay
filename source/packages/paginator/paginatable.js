/**
 * @module Ojay.Paginatable
 */
Ojay.Paginatable = new JS.Module('Ojay.Paginatable', {
    include: [Ojay.Observable, JS.State],
    
    /**
     * @returns {Object}
     */
    getInitialState: function() {
        return {page: 1};
    },
    
    /**
     * @param {Object} state
     * @param {Function} callback
     * @param {Object} scope
     * @returns {Paginator}
     */
    changeState: function(state, callback, scope) {
        if (state.page !== undefined) this._handleSetPage(state.page, callback, scope);
        return this;
    },
    
    /**
     * <p>Returns the direction of the paginator.</p>
     * @returns {String}
     */
    getDirection: function() {
        return this._options.direction;
    },
    
    /**
     * <p>Returns a boolean to indicate whether the paginator loops.</p>
     * @returns {Boolean}
     */
    isLooped: function() {
        return !!this._options.looped || !!this._options.infinite;
    },
    
    /**
     * <p>Returns an Ojay collection wrapping the wrapper element added to your document to
     * contain the original content element and let it slide.</p>
     * @returns {DomCollection}
     */
    getContainer: function() {
        return this.getHTML();
    },
    
    /**
     * <p>Returns an Ojay collection wrapping the sliding element, i.e. the element you specify
     * when creating the <tt>Paginator</tt> instance.</p>
     * @returns {DomCollection}
     */
    getSubject: function() {
        return this._elements._subject || undefined;
    },
    
    /**
     * <p>Returns a <tt>Region</tt> object representing the area of the document occupied by
     * the <tt>Paginator</tt>'s container element.</p>
     * @returns {Region}
     */
    getRegion: function() {
        if (!this._elements._container) return undefined;
        return this._elements._container.getRegion();
    },
    
    /**
     * <p>Returns the number of the current page, numbered from 1.</p>
     * @returns {Number}
     */
    getCurrentPage: function() {
        return this._currentPage || undefined;
    },
    
    /**
     * @returns {Number}
     */
    getCurrentOffset: function() {
        return this._reportedOffset;
    },
    
    /**
     * <p>Places a default set of UI controls before or after the <tt>Paginator</tt> in the
     * document and returns a <tt>Paginator.Controls</tt> instance representing this UI.</p>
     * @returns {Paginator.Controls}
     */
    addControls: function(position) {
        if (this.inState('CREATED') || !/^(?:before|after)$/.test(position)) return undefined;
        var controls = new Ojay.Paginator.Controls(this);
        this.getContainer().insert(controls.getHTML().node, position);
        return controls;
    },
    
    states: {
        CREATED: {
            /**
             * <p>Sets the initial page for the paginator to start at when in the CREATED
             * state. No scrolling takes place, and the number set will override the initial
             * page setting and any setting pulled in by the history manager.</p>
             * @param {Number} page
             * @returns {Paginator}
             */
            setPage: function(page) {
                this._currentPage = Number(page);
                return this;
            }
        },
        
        READY: {
            /**
             * <p>Sets the current page of the <tt>Paginator</tt> by scrolling the subject
             * element. Will fire a <tt>pagechange</tt> event if the page specified is not
             * equal to the current page.</p>
             * @param {Number} page
             * @param {Function} callback
             * @param {Object} scope
             * @returns {Paginator}
             */
            setPage: function(page, callback, scope) {
                var pages = this.getPages(), page = Number(page);
                if (this._options.looped && page < 1) page += pages;
                if (this._options.looped && page > pages) page -= pages;
                
                if (!this.isLooped() && (page == this._currentPage || page < 1 || page > pages))
                    return this;
                
                this.changeState({page: page}, callback, scope);
                return this;
            },
            
            /**
             * <p>Sets the scroll offset of the subject element. If <tt>amount</tt> is between
             * 0 and 1, it is taken as a fraction of the total offset. If it is greater than 1,
             * it is taken as an absolute pixel value. The options hash may specify any of
             * the following:</p>
             * 
             * <ul>
             *     <li><tt>animate</tt>: sets whether the scroll move should be animated</li>
             *     <li><tt>silent</tt>: set to <tt>true</tt> to prevent any <tt>scroll</tt> events from firing</li>
             *     <li><tt>absolute</tt>: if <tt>true</tt> prevents values 0 to 1 being scaled up</li>
             *     <li><tt>clip</tt>: set to <tt>false</tt> to stop offsets being clipped to the scroll limits</li>
             * </ul>
             * 
             * <p>This method is largely for internal use and is a little messy due to all
             * the behaviour it must support: overshooting filmstrips, infinite looped pagination,
             * relative values, and page-change detection for firing events. I would refactor
             * but this really should all be one atomic action.</p>
             * 
             * @param {Number} amount
             * @param {Object} options
             * @param {Function} callback
             * @param {Object} scope
             * @returns {Paginatable}
             */
            setScroll: function(amount, options, callback, scope) {
                var options    = options || {},
                    scrollTime = options._scrollTime || this._options.scrollTime,
                    vertical   = (this._options.direction == 'vertical'),
                    limits     = this.getScrollLimits(),
                    total      = limits[1] - limits[0],
                    chain      = new JS.MethodChain(),
                    settings;
                
                // Scale up values between 0 and 1
                if (amount >= 0 && amount <= 1 && !options.absolute) amount = limits[0] + amount * total;
                this._reportedOffset = amount;
                
                // Clip to the object's scroll offset limits
                if (options.clip !== false) amount = Math.min(Math.max(amount, limits[0]), limits[1]);
                
                // Either animate or go straight to the new offset
                if (options.animate && YAHOO.util.Anim) {
                    this.setState('SCROLLING');
                    settings = vertical
                            ? { top: {to: -amount} }
                            : { left: {to: -amount} };
                    this._elements._subject.animate(settings,
                        scrollTime, {easing: this._options.easing})._(function(self) {
                        self.setState('READY');
                        chain.fire(scope || self);
                        if (callback) callback.call(scope || null);
                    }, this);
                } else {
                    settings = vertical
                            ? { top: (-amount) + 'px' }
                            : { left: (-amount) + 'px' };
                    this._elements._subject.setStyle(settings);
                }
                
                // Calculate relative offset between 0 and 1 for event listeners
                var reportedOffset = (amount - limits[0])/total;
                if (reportedOffset < 0) reportedOffset = 1;
                if (reportedOffset > 1) reportedOffset = 0;
                
                if (!options.silent) this.notifyObservers('scroll', reportedOffset, total);
                
                // Detect page changes
                var pages = this.getPages(),
                    page  = this._pageFromOffset(this._reportedOffset);
                
                if (page != this._currentPage) {
                    this._currentPage = page;
                    this.notifyObservers('pagechange', page);
                    
                    if (page == 1) this.notifyObservers('firstpage');
                    if (page == pages) this.notifyObservers('lastpage');
                }
                
                return (options.animate && YAHOO.util.Anim) ? chain : this;
            }
        },
        
        SCROLLING: {}
    }
});

