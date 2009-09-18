/**
 * <p>The <tt>FilmStrip</tt> class is similar to the <tt>Paginator</tt> class, in that it
 * is designed to shrink a block of content into a smaller scrollable area. The difference
 * is that where <tt>Paginator</tt> affords a grid of homogenously sized elements, the
 * <tt>FilmStrip</tt> class is used for a single row or column of elements of different
 * widths (for a row) or heights (for a column). A good example would be a strip of images
 * all with the same height, but different widths (hence the name).</p>
 *
 * <p>The starting point for creating a <tt>FilmStrip</tt> is the same as for <tt>Paginator</tt>,
 * for example a list of images:</p>
 *
 * <pre><code>    &lt;div id="gallery"&gt;
 *         &lt;div class="item"&gt;&lt;img src="01.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="02.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="03.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="04.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="05.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="06.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="07.jpg" /&gt;&lt;/div&gt;
 *         &lt;div class="item"&gt;&lt;img src="08.jpg" /&gt;&lt;/div&gt;
 *     &lt;/div&gt;</code></pre>
 *
 * <p>After applying a <tt>FilmStrip</tt> to this markup, its is wrapped in some elements
 * to facilitate, scrolling, leaving us with:</p>
 *
 * <pre><code>    &lt;div class="filmstrip"&gt;
 *         &lt;div id="gallery"&gt;
 *             &lt;div class="item"&gt;&lt;img src="01.jpg" /&gt;&lt;/div&gt;
 *             &lt;div class="item"&gt;&lt;img src="02.jpg" /&gt;&lt;/div&gt;
 *             &lt;div class="item"&gt;&lt;img src="03.jpg" /&gt;&lt;/div&gt;
 *             &lt;div class="item"&gt;&lt;img src="04.jpg" /&gt;&lt;/div&gt;
 *             &lt;div class="item"&gt;&lt;img src="05.jpg" /&gt;&lt;/div&gt;
 *             &lt;div class="item"&gt;&lt;img src="06.jpg" /&gt;&lt;/div&gt;
 *             &lt;div class="item"&gt;&lt;img src="07.jpg" /&gt;&lt;/div&gt;
 *             &lt;div class="item"&gt;&lt;img src="08.jpg" /&gt;&lt;/div&gt;
 *         &lt;/div&gt;
 *     &tl;/div&gt;</code></pre>
 *
 * <p>Note that <tt>FilmStrip</tt> does not split the content into pages, it merely wraps
 * it in a an element to allow clipping and scrolling. The 'pages' are simply the
 * individual items; calling <tt>setPage()</tt> centers the given item within the
 * visible portion of the strip.</p>
 *
 * <p>Some methods in this class may have slightly odd names; this is because I
 * want the API to be reasonably close to that for <tt>Paginator</tt> so they can
 * be easily interchanged.</p>
 *
 * @constructor
 * @class FilmStrip
 */
Ojay.FilmStrip = new JS.Class('Ojay.FilmStrip', /** @scope Ojay.FilmStrip.prototype */{
    include: Ojay.Paginatable,
    
    extend: /** @scope Ojay.FilmStrip */{
        CONTAINER_CLASS:    'filmstrip',
        PAGE_CLASS:         'item',
        SCROLL_TIME:        0.5,
        DIRECTION:          'horizontal',
        EASING:             'easeBoth',
        
        /**
         * <p>A small data class for representing items. When an item is clicked,
         * its parent <tt>FilmStrip</tt> focuses on it.</p>
         * @constructor
         * @class Ojay.FilmStrip.Item
         */
        Item: new JS.Class({
            /**
             * @param {FilmStrip} strip
             * @param {DomCollection} element
             */
            initialize: function(strip, element) {
                this._element = element;
                var region    = element.getRegion();
                this._width   = region.getWidth();
                this._height  = region.getHeight();
                
                this._strip = strip;
                element.on('click')._(strip).focusItem(this);
            },
            
            /**
             * @returns {Number}
             */
            getWidth: function() {
                return this._width;
            },
            
            /**
             * @returns {Number}
             */
            getHeight: function() {
                return this._height;
            }
        })
    },
    
    /**
     * <p>To initialize, the <tt>FilmStrip</tt> instance needs a CSS selector and some configuration
     * options. Available options are:</p>
     *
     * <ul>
     *      <li><tt>width</tt> - the width as a string, in any units, e.g. '512px'.</li>
     *      <li><tt>height</tt> - the height as a string, in any units, e.g. '512px'.</li>
     *      <li><tt>scrollTime</tt> - the duration of the scoll effect in seconds.</li>
     *      <li><tt>easing</tt> - sets the name of the easing effect to use.</li>
     *      <li><tt>direction</tt> - 'horizontal' or 'vertical', sets scroll direction.</li>
     * </ul>
     *
     * @param {String|HTMLElement|DomCollection} subject
     * @param {Object} options
     */
    initialize: function(subject, options) {
        this._selector = subject;
        this._elements = {};
        
        options = this._options = options || {};
        options.scrollTime = options.scrollTime || this.klass.SCROLL_TIME;
        options.direction  = options.direction  || this.klass.DIRECTION;
        options.easing     = options.easing     || this.klass.EASING;
        this.setState('CREATED');
    },
    
    /**
     * <p>Returns an Ojay collection wrapping all the HTML used by the filmstrip.</p>
     * @returns {DomCollection}
     */
    getHTML: function() {
        var elements = this._elements, options = this._options;
        if (elements._container) return elements._container;
        var container = Ojay( Ojay.HTML.div({className: this.klass.CONTAINER_CLASS}) );
        container.addClass(this._options.direction);
        
        var dimensions = this.getDimensions(),
            vertical   = (this.getDirection() == 'vertical'),
            width      = vertical ? dimensions.width + 'px' : options.width,
            height     = vertical ? options.height : dimensions.height + 'px';
        
        container.setStyle({
            width:      width,
            height:     height,
            overflow:   'hidden',
            padding:    '0 0 0 0',
            border:     'none',
            position:   'relative'
        });
        return elements._container = container;
    },
    
    /**
     * @returns {Number}
     */
    getTotalOffset: function() {
        var region = this.getRegion(),
            dims   = this.getDimensions();
        
        return this.getDirection() == 'vertical'
            ? dims.height - region.getHeight()
            : dims.width  - region.getWidth();
    },
    
    /**
     * <p>Returns an Ojay collection wrapping the child elements of the subject.</p>
     * @returns {DomCollection}
     */
    getItems: function() {
        if (this._items) return this._items;
        
        return this._items = this._elements._subject.children().map(function(child) {
            return new this.klass.Item(this, child);
        }, this);
    },
    
    /**
     * <p>Returns the number of child elements the <tt>FilmStrip</tt> has.</p>
     * @returns {Number}
     */
    getPages: function() {
        return this._numPages = this.getItems().length;
    },
    
    /**
     * <p>Returns an object with <tt>width</tt> and <tt>height</tt> attributes
     * describing the size of the content contained in the filmstrip.</p>
     * @returns {Object}
     */
    getDimensions: function() {
        var vertical = (this.getDirection() == 'vertical'),
            width    = 0,
            height   = 0;
        
        this.getItems().forEach(function(item) {
            if (vertical) {
                width   = Math.max(width, item.getWidth());
                height += item.getHeight();
            } else {
                width  += item.getWidth();
                height  = Math.max(height, item.getHeight());
            }
        });
        
        return {width: width, height: height};
    },
    
    /**
     * <p>Returns an array containing the pixel offsets of the edges between adjacent
     * child elements, including the leading and trailing edge of the whole set.</p>
     * @returns {Array}
     */
    _getEdges: function() {
        if (this._edges) return this._edges.slice();
        
        var vertical = (this.getDirection() == 'vertical'),
            method   = vertical ? 'getHeight' : 'getWidth',
            edges    = [0];
        
        this.getItems().forEach(function(item) {
            var size     = item[method](),
                previous = edges[edges.length-1];
            edges.push(previous + size);
        });
        
        return (this._edges = edges).slice();
    },
    
    /**
     * <p>Returns an array of the pixel offsets of the centers of the child elements.</p>
     * @returns {Array}
     */
    _getCenters: function() {
        var centers = [];
        this._getEdges().reduce(function(x,y) {
            centers.push((x + y) / 2);
            return y;
        });
        return centers;
    },
    
    states: {
        /**
         * <p>The <tt>FilmStrip</tt> is in the CREATED state when it has been instantiated but
         * none of its DOM interactions have taken place. This attachment is deferred to the
         * <tt>setup()</tt> call so that object can be history-managed before its UI is set up.</p>
         */
        CREATED: {
            /**
             * <p>Sets up all the DOM changes the <tt>FilmStrip</tt> needs. If you want to history
             * manage the object, make sure you set up history management before calling this method.
             * Moves the object to the READY state if successful.</p>
             * @returns {FilmStrip}
             */
            setup: function() {
                var subject = this._elements._subject = Ojay(this._selector).at(0);
                if (!subject.node) return this;
                
                var container = this.getHTML();
                subject.insert(container.node, 'after');
                container.insert(subject.node);
                subject.setStyle({padding: '0 0 0 0', border: 'none', position: 'absolute', left: 0, top: 0});
                
                var dims  = this.getDimensions();
                
                var style = (this._options.direction == 'vertical')
                        ? { width: dims.width + 'px', height: (dims.height + 1000) + 'px' }
                        : { width: (dims.width + 1000) + 'px', height: dims.height + 'px' };
                
                subject.setStyle(style);
                
                var state = this.getInitialState();
                this.setState('READY');
                if (this._currentPage === undefined) this._currentPage = state.page;
                this._handleSetPage(this._currentPage);
                
                return this;
            }
        },
        
        /**
         * <p>The <tt>FilmStrip</tt> is in the READY state when all its DOM behaviour has been
         * set up and it is not in the process of scrolling.</p>
         */
        READY: {
            /**
             * <p>Handles request to <tt>changeState()</tt>.</p>
             * @param {Number} page
             * @param {Function} callback
             * @param {Object} scope
             */
            _handleSetPage: function(page, callback, scope) {
                var vertical = (this.getDirection() == 'vertical'),
                    method   = vertical ? 'getHeight' : 'getWidth',
                    center   = this.getRegion()[method]() / 2,
                    offset   = this._getCenters()[page - 1] - center;
                
                if (page !== this._currentPage) {
                    this.notifyObservers('pagechange', page);
                    if (page == 1) this.notifyObservers('firstpage');
                    if (page == this.getPages()) this.notifyObservers('lastpage');
                }
                
                this._currentPage = page;
                this.setScroll(offset, {animate: true}, callback, scope);
            },
            
            /**
             * <p>Increments the current page by one, firing a <tt>pagechange</tt> event.</p>
             * @returns {FilmStrip}
             */
            incrementPage: function() {
                return this.setPage(this._currentPage + 1);
            },
            
            /**
             * <p>Decrements the current page by one, firing a <tt>pagechange</tt> event.</p>
             * @returns {FilmStrip}
             */
            decrementPage: function() {
                return this.setPage(this._currentPage - 1);
            },
            
            // TODO Paginator#snapToPage
            
            /**
             * <p>For filmstrips, this accepts a <tt>FilmStrip.Item</tt> and centers the
             * view on that item. Use to handle clicks on individual items. If called with
             * a number, simply centers on that numbered page.</p>
             * @param {FilmStrip.Item|Number} item
             * @returns {FilmStrip}
             */
            focusItem: function(item) {
                if (typeof item !== 'number') item = this._items.indexOf(item) + 1;
                this.setPage(item);
                return this;
            },
            
            setScroll: function(amount, options, callback, scope) {
                if (this._options.overshoot === false)
                    amount = Math.min(Math.max(amount, 0), this.getTotalOffset());
                
                return this.callSuper(amount, options, callback, scope);
            }
        }
    }
});

