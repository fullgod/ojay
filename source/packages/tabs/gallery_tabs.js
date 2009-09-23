/**
 * @class GalleryTabs
 * @constructor
 */
Ojay.GalleryTabs = new JS.Class('Ojay.GalleryTabs', Ojay.AjaxTabs, /** @scope Ojay.GalleryTabs.prototype */{
    /**
     * <p>Tells the <tt>GalleryTabs</tt> to insert the image for the given
     * page, if the image is not already loaded. Fires <tt>pagerequest</tt> and
     * <tt>pageload</tt> events.</p>
     * @param {Number} page
     * @param {Function} callback
     * @param {Object} scope
     * @returns {GalleryTabs}
     */
    loadPage: function(page, callback, scope) {
        if (this.pageLoaded(page) || this.inState('CREATED')) return this;
        
        var link = this._links[page - 1],
            url  = link.href,
            text = Ojay(link).children('img').node.alt,
            self = this;
        
        this.notifyObservers('pagerequest', url);
        
        var image = Ojay(Ojay.HTML.img({
            src: url,
            alt: text
        }));
        
        image.on('load', function() {
            Ojay(self._tabGroup[page - 1]).insert(image);
            self._loaded[page - 1] = true;
            self.notifyObservers('pageload', url, image);
            if (typeof callback == 'function') callback.call(scope || null);
        });
        
        return this;
    }
});
