Ojay.FilmStrip = new JS.Class('Ojay.FilmStrip', {
    include: Ojay.Paginatable,
    
    initialize: function(subject, options) {
        this._selector = subject;
        this._elements = {};
        
        options = this._options  = options || {};
        options.scrollTime = options.scrollTime || this.klass.SCROLL_TIME;
        options.direction  = options.direction  || this.klass.DIRECTION;
        options.easing     = options.easing     || this.klass.EASING;
        this.setState('CREATED');
    },
    
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
    
    getItems: function() {
        if (this._items) return this._items;
        
        return this._items = this._elements._subject.children().map(function(child) {
            return new this.klass.Item(this, child);
        }, this);
    },
    
    getTotalOffset: function() {
        var region = this.getRegion(),
            dims   = this.getDimensions();
        
        return this.getDirection() == 'vertical'
            ? dims.height - region.getHeight()
            : dims.width  - region.getWidth();
    },
    
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
    
    getPages: function() {
        return this._numPages = this.getItems().length;
    },
    
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
    
    _getCenters: function() {
        var centers = [];
        this._getEdges().reduce(function(x,y) {
            centers.push((x + y) / 2);
            return y;
        });
        return centers;
    }.traced(),
    
    states: {
        CREATED: {
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
        
        READY: {
            focusItem: function(item) {
                this.setPage(this._items.indexOf(item) + 1);
                return this;
            },
            
            incrementPage: function() {
                return this.setPage(this._currentPage + 1);
            },
            
            decrementPage: function() {
                return this.setPage(this._currentPage - 1);
            },
            
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
            
            setScroll: function(amount, options, callback, scope) {
                var region   = this.getRegion(),
                    vertical = (this.getDirection() == 'vertical'),
                    method   = vertical ? 'getHeight' : 'getWidth',
                    halfR    = region[method]() / 2,
                    total    = this.getTotalOffset();
                
                if (amount >= 0 && amount <= 1) amount = amount * total;
                
                if (this._options.overshoot === false) {
                    amount = Math.max(amount, 0);
                    amount = Math.min(amount, total);
                }
                
                var settings = {};
                settings[vertical ? 'top' : 'left'] = {to: -amount};
                this._elements._subject.animate(settings, this._options.scrollTime, {easing: this._options.easing});
                
                return this;
            }
        }
    },
    
    extend: {
        CONTAINER_CLASS:    'filmstrip',
        PAGE_CLASS:         'item',
        SCROLL_TIME:        0.5,
        DIRECTION:          'horizontal',
        EASING:             'easeBoth',
        
        Item: new JS.Class({
            initialize: function(strip, element) {
                this._element = element;
                var region    = element.getRegion();
                this._width   = region.getWidth();
                this._height  = region.getHeight();
                
                this._strip = strip;
                element.on('click')._(strip).focusItem(this);
            },
            
            getWidth: function() {
                return this._width;
            },
            
            getHeight: function() {
                return this._height;
            }
        })
    }
});

