(function (d3,d3Axis,d3Collection,d3Color,d3Dispatch,d3Drag,d3Dsv,d3Ease,d3Format,d3Geo,d3Interpolate,d3Shape,d3Path,d3Queue,d3Random,d3Request,d3Scale,d3ScaleChromatic,d3Selection,d3Time,d3Timer,d3Transition,d3Zoom) {
'use strict';

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/*
 * Extension to D3 to facilitate re-ordering elements
 */
d3Selection.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};
d3Selection.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};
var Padding = (function () {
    function Padding(a, b, c, d) {
        if (a === undefined) {
            this.top = this.bottom = this.left = this.right = 0;
        }
        else if (b === undefined) {
            this.top = this.bottom = this.left = this.right = a;
        }
        else if (c === undefined) {
            this.top = this.bottom = a;
            this.left = this.right = b;
        }
        else {
            this.top = a;
            this.bottom = b;
            this.left = c;
            this.right = d;
        }
    }
    Padding.prototype.centerX = function (width) {
        return this.left + this.width(width) / 2;
    };
    Padding.prototype.centerY = function (height) {
        return this.top + this.height(height) / 2;
    };
    Padding.prototype.width = function (width) {
        return width - this.left - this.right;
    };
    Padding.prototype.height = function (height) {
        return height - this.top - this.bottom;
    };
    Padding.prototype.translate = function (x, y) {
        return "translate(" + (this.left + x) + "px, " + (this.top + y) + "px)";
    };
    Padding.prototype.translateX = function (x) {
        return "translate(" + (this.left + x) + "px, 0)";
    };
    Padding.prototype.translateY = function (y) {
        return "translate(0, " + (this.top + y) + "px)";
    };
    Padding.add = function (a, b) {
        return new Padding(a.top + b.top, a.bottom + b.bottom, a.left + b.left, a.right + b.right);
    };
    return Padding;
}());

var Dispatch;
(function (Dispatch) {
    function isEmptySelection(selection$$1) {
        return (selection$$1.neighborhoods.length === 0 &&
            selection$$1.listings.length === 0 &&
            selection$$1.priceBlocks.length === 0 &&
            selection$$1.markupBlocks.length === 0 &&
            selection$$1.amenities.length === 0);
    }
    Dispatch.isEmptySelection = isEmptySelection;
    function isOnlyListingSelection(selection$$1) {
        return (selection$$1.listings.length &&
            selection$$1.neighborhoods.length === 0 &&
            selection$$1.priceBlocks.length === 0 &&
            selection$$1.markupBlocks.length === 0 &&
            selection$$1.amenities.length === 0);
    }
    Dispatch.isOnlyListingSelection = isOnlyListingSelection;
    function emptySelection() {
        return {
            neighborhoods: [],
            listings: [],
            priceBlocks: [],
            markupBlocks: [],
            amenities: []
        };
    }
    Dispatch.emptySelection = emptySelection;
    function cloneSelection(selection$$1) {
        var cloned = Dispatch.emptySelection();
        if (selection$$1.neighborhoods)
            cloned.neighborhoods = selection$$1.neighborhoods.slice();
        if (selection$$1.listings)
            cloned.listings = selection$$1.listings.slice();
        if (selection$$1.priceBlocks)
            cloned.priceBlocks = selection$$1.priceBlocks.slice();
        if (selection$$1.markupBlocks)
            cloned.markupBlocks = selection$$1.markupBlocks.slice();
        if (selection$$1.amenities)
            cloned.amenities = selection$$1.amenities.slice();
        return cloned;
    }
    Dispatch.cloneSelection = cloneSelection;
    function emptyHighlight() {
        return {
            neighborhood: undefined,
            listing: undefined
        };
    }
    Dispatch.emptyHighlight = emptyHighlight;
    function emptyFilter() {
        return {
            neighborhoods: [],
            priceBlocks: [],
            markupBlocks: [],
            amenities: []
        };
    }
    Dispatch.emptyFilter = emptyFilter;
    function isEmptyFilter(filter) {
        return (filter.neighborhoods.length === 0 &&
            filter.priceBlocks.length === 0 &&
            filter.markupBlocks.length === 0 &&
            filter.amenities.length === 0);
    }
    Dispatch.isEmptyFilter = isEmptyFilter;
    function cloneFilter(filter) {
        var cloned = Dispatch.emptyFilter();
        if (filter.neighborhoods)
            cloned.neighborhoods = filter.neighborhoods.slice();
        if (filter.priceBlocks)
            cloned.priceBlocks = filter.priceBlocks.slice();
        if (filter.markupBlocks)
            cloned.markupBlocks = filter.markupBlocks.slice();
        if (filter.amenities)
            cloned.amenities = filter.amenities.slice();
        return cloned;
    }
    Dispatch.cloneFilter = cloneFilter;
    function filterFromSelection(selection$$1) {
        var filter = Dispatch.emptyFilter();
        filter.neighborhoods = selection$$1.neighborhoods.slice();
        filter.priceBlocks = selection$$1.priceBlocks.slice();
        filter.markupBlocks = selection$$1.markupBlocks.slice();
        filter.amenities = selection$$1.amenities.slice();
        return filter;
    }
    Dispatch.filterFromSelection = filterFromSelection;
    
})(Dispatch || (Dispatch = {}));
var DispatchEvent = {
    Load: 'load',
    Select: 'select',
    Highlight: 'highlight',
    Filter: 'filter'
};
// Load:
//      - geojson: map data
//      - neighborhoods: mapping from neighborhood name to listing ids
//      - listings: mapping from listing ids to listings
//      - priceBlocks: list of blocks that contain the price ranges
//      - markupBlocks: list of blocks that contain the markup ranges
//      - amenities: list of amenities that are tracked
// Select:
//      - neighborhoods: array of neighborhood 
//      - listings: array of listing 
//      - priceBlocks: array of price blocks that are selected
//      - markupBlocks: array of markup blocks that are selected
//      - amenities: array of amenities that are selected
//
// Highlight:
//      - neighborhood: neighborhood name
//      - listing: listing id
//
// (either neighborhoods, or listings, or none)
// Filter:
//      - neighborhoods: array of neighborhood
//      - priceBlocks: array of price blocks that are selected
//      - markupBlocks: array of markup blocks that are selected
//      - amenities: array of amenities that are selected

var Listing;
(function (Listing) {
    // Parse the amenities into an array for the given amenities string
    function parseAmenities(amenities) {
        return amenities
            .match(/{(.*?)}/)[1]
            .split(',')
            .map(function (l) {
            if (l.charAt(0) === '"')
                return l.substring(1, l.length - 1);
            else
                return l;
        });
    }
    function parseCSVRow(row, neighborhood) {
        return {
            id: +row['id'],
            name: row['name'],
            description: row['description'],
            neighborhood: neighborhood,
            priceBlock: undefined,
            markupBlock: undefined,
            amenities: parseAmenities(row['amenities']),
            cancellation_policy: row['cancellation_policy'],
            reviews: {
                number_of_reviews: +row['number_of_reviews'],
                number: +(row['number_of_reviews']),
                numberPerMonth: +(row['reviews_per_month']),
                rating: parseInt(row['review_scores_rating']),
                scores: {
                    accuracy: +row['review_scores_accuracy'],
                    cleanliness: +row['review_scores_cleanliness'],
                    checkin: +row['review_scores_checkin'],
                    communication: +row['review_scores_communication'],
                    location: +row['review_scores_location'],
                    value: +row['review_scores_value']
                }
            },
            guests_included: +row['guests_included'],
            prices: {
                markup_amount: +row['rent_difference'],
                markup_percentage: +row['rent_difference_percentage_of_median'] * 100,
                airbnb: {
                    daily: +row['price'],
                    monthly: +row['airbnb_monthly_rent'],
                    monthly_per_bedroom: +row['airbnb_monthly_rent_per_bedroom']
                },
                trulia: {
                    rent_per_bedroom: +row['trulia_median_rent_per_bedroom']
                }
            }
        };
    }
    Listing.parseCSVRow = parseCSVRow;
    
})(Listing || (Listing = {}));

var Block;
(function (Block) {
    function contains(block, listing) {
        var value = 0;
        if (block.type === "price") {
            value = listing.prices.airbnb.daily;
        }
        else {
            value = listing.prices.markup_percentage;
        }
        return block.minimum <= value && (isNaN(block.maximum) || value < block.maximum);
    }
    Block.contains = contains;
    function value(block, listing) {
        if (block.type === "price") {
            return listing.prices.airbnb.daily;
        }
        else {
            return listing.prices.markup_percentage;
        }
    }
    Block.value = value;
})(Block || (Block = {}));

var BaseComponent = (function () {
    function BaseComponent(selector, dispatcher) {
        this.element = document.querySelector(selector);
        this.selector = selector;
        this.dispatcher = dispatcher;
        // Set up dispatch listeners
        this.dispatcher.on(this.getComponentEventName(DispatchEvent.Load), this.eventBind(this.onLoad));
        this.dispatcher.on(this.getComponentEventName(DispatchEvent.Select), this.eventBind(this.onSelect));
        this.dispatcher.on(this.getComponentEventName(DispatchEvent.Highlight), this.eventBind(this.onHighlight));
        this.dispatcher.on(this.getComponentEventName(DispatchEvent.Filter), this.eventBind(this.onFilter));
        // Set up empty events
        this.selection = Dispatch.emptySelection();
        this.highlight = { neighborhood: undefined, listing: undefined };
        this.filter = Dispatch.emptyFilter();
        this.allSelectedListings = [];
        this.filteredListings = [];
        this.filteredListingsMap = new Map();
        this.filteredNeighborhoods = [];
        this.filteredNeighborhoodMap = new Map();
    }
    BaseComponent.prototype.eventBind = function (handler) {
        var self = this;
        return function (args) {
            // In this function, 'this' is the sender of the dispatch call
            handler.call(self, args);
        };
    };
    BaseComponent.prototype.getComponentName = function () {
        return this.constructor['name'];
    };
    BaseComponent.prototype.getComponentEventName = function (event) {
        return event + '.' + this.getComponentName();
    };
    BaseComponent.prototype.computeAllSelectedListings = function () {
        this.allSelectedListings = [];
        if (Dispatch.isEmptySelection(this.selection)) {
            return;
        }
        var _loop_1 = function(listing) {
            // Don't add listings not in a selected neighborhood
            if (this_1.selection.neighborhoods.length) {
                if (this_1.selection.neighborhoods.indexOf(listing.neighborhood) === -1)
                    return "continue";
            }
            // Don't add listings not in the selected listings
            if (this_1.selection.listings.length) {
                if (this_1.selection.listings.indexOf(listing) === -1)
                    return "continue";
            }
            // Don't add listings not in a selected price block
            if (this_1.selection.priceBlocks.length) {
                if (this_1.selection.priceBlocks.indexOf(listing.priceBlock) === -1)
                    return "continue";
            }
            // Don't add listings not in a selected markup block
            if (this_1.selection.markupBlocks.length) {
                if (this_1.selection.markupBlocks.indexOf(listing.markupBlock) === -1)
                    return "continue";
            }
            // Don't add listings what don't have the selected amenities
            if (this_1.selection.amenities.length) {
                if (!this_1.selection.amenities.every(function (amenity) { return listing.amenities.indexOf(amenity) !== -1; }))
                    return "continue";
            }
            this_1.allSelectedListings.push(listing);
        };
        var this_1 = this;
        for (var _i = 0, _a = this.filteredListings; _i < _a.length; _i++) {
            var listing = _a[_i];
            var state_1 = _loop_1(listing);
            if (state_1 === "continue") continue;
        }
    };
    BaseComponent.prototype.dispatchListingHighlight = function (listing, highlight) {
        this.dispatcher.call(DispatchEvent.Highlight, this, {
            neighborhood: undefined,
            listing: (highlight ? listing : undefined)
        });
    };
    BaseComponent.prototype.dispatchNeighborhoodHighlight = function (neighborhood, highlight) {
        this.dispatcher.call(DispatchEvent.Highlight, this, {
            neighborhood: (highlight ? neighborhood : undefined),
            listing: undefined
        });
    };
    BaseComponent.prototype.dispatchListingSelection = function (listing, createNewSelection) {
        if (createNewSelection) {
            var sel = Dispatch.emptySelection();
            sel.listings.push(listing);
            this.dispatcher.call(DispatchEvent.Select, this, sel);
        }
        else {
            // Check whether to add or remove this listing from the selection
            if (this.selection.listings.indexOf(listing) !== -1) {
                // Listing is already selected, so send out a selection event with this deselected
                var sel = Dispatch.cloneSelection(this.selection);
                var selectedIndex = sel.listings.indexOf(listing);
                sel.listings.splice(selectedIndex, 1);
                this.dispatcher.call(DispatchEvent.Select, this, sel);
            }
            else {
                // Listing is not already selected, so send out a selection event with this selected
                var sel = Dispatch.cloneSelection(this.selection);
                sel.listings.push(listing);
                this.dispatcher.call(DispatchEvent.Select, this, sel);
            }
        }
    };
    BaseComponent.prototype.dispatchNeighborhoodFilter = function (neighborhoods) {
        var filter = Dispatch.cloneFilter(this.filter);
        filter.neighborhoods = neighborhoods.slice();
        this.dispatcher.call(DispatchEvent.Filter, this, filter);
    };
    BaseComponent.prototype.dispatchNeighborhoodSelection = function (neighborhood, createNewSelection) {
        if (createNewSelection) {
            var sel = Dispatch.emptySelection();
            sel.neighborhoods.push(neighborhood);
            this.dispatcher.call(DispatchEvent.Select, this, sel);
        }
        else {
            // Check whether to add or remove this neighborhood from the selection
            if (this.selection.neighborhoods.indexOf(neighborhood) !== -1) {
                // Neighborhood is already selected, so send out a selection event with this deselected
                var sel = Dispatch.cloneSelection(this.selection);
                var selectedIndex = sel.neighborhoods.indexOf(neighborhood);
                sel.neighborhoods.splice(selectedIndex, 1);
                this.dispatcher.call(DispatchEvent.Select, this, sel);
            }
            else {
                // Neighborhood is not already selected, so send out a selection event with this selected
                var sel = Dispatch.cloneSelection(this.selection);
                sel.neighborhoods.push(neighborhood);
                this.dispatcher.call(DispatchEvent.Select, this, sel);
            }
        }
    };
    BaseComponent.prototype.dispatchPriceBlockFilter = function (priceBlocks) {
        var filter = Dispatch.cloneFilter(this.filter);
        filter.priceBlocks = priceBlocks.slice();
        this.dispatcher.call(DispatchEvent.Filter, this, filter);
    };
    BaseComponent.prototype.dispatchBlockSelection = function (block, createNewSelection) {
        if (block.type === 'price') {
            if (createNewSelection) {
                var sel = Dispatch.emptySelection();
                sel.priceBlocks.push(block);
                this.dispatcher.call(DispatchEvent.Select, this, sel);
            }
            else {
                // Check whether to add or remove this price block from the selection
                if (this.selection.priceBlocks.indexOf(block) !== -1) {
                    // Block is already selected, so send out a selection event with this deselected
                    var sel = Dispatch.cloneSelection(this.selection);
                    var selectedIndex = this.selection.priceBlocks.indexOf(block);
                    sel.priceBlocks.splice(selectedIndex, 1);
                    this.dispatcher.call(DispatchEvent.Select, this, sel);
                }
                else {
                    // Price block is not already selected, so send out a selection event with this selected
                    var sel = Dispatch.cloneSelection(this.selection);
                    sel.priceBlocks.push(block);
                    this.dispatcher.call(DispatchEvent.Select, this, sel);
                }
            }
        }
        else {
            if (createNewSelection) {
                var sel = Dispatch.emptySelection();
                sel.markupBlocks.push(block);
                this.dispatcher.call(DispatchEvent.Select, this, sel);
            }
            else {
                // Check whether to add or remove this markup block from the selection
                if (this.selection.markupBlocks.indexOf(block) !== -1) {
                    // Block is already selected, so send out a selection event with this deselected
                    var sel = Dispatch.cloneSelection(this.selection);
                    var selectedIndex = this.selection.markupBlocks.indexOf(block);
                    sel.markupBlocks.splice(selectedIndex, 1);
                    this.dispatcher.call(DispatchEvent.Select, this, sel);
                }
                else {
                    // Markup block is not already selected, so send out a selection event with this selected
                    var sel = Dispatch.cloneSelection(this.selection);
                    sel.markupBlocks.push(block);
                    this.dispatcher.call(DispatchEvent.Select, this, sel);
                }
            }
        }
    };
    BaseComponent.prototype.dispatchMarkupBlockFilter = function (markupBlocks) {
        var filter = Dispatch.cloneFilter(this.filter);
        filter.markupBlocks = markupBlocks.slice();
        this.dispatcher.call(DispatchEvent.Filter, this, filter);
    };
    BaseComponent.prototype.dispatchAmenitySelection = function (amenity, createNewSelection) {
        if (createNewSelection) {
            var sel = Dispatch.emptySelection();
            sel.amenities.push(amenity);
            this.dispatcher.call(DispatchEvent.Select, this, sel);
        }
        else {
            // Check whether to add or remove this amenity from the selection
            if (this.selection.amenities.indexOf(amenity) !== -1) {
                // Amenity is already selected, so send out a selection event with this deselected
                var sel = Dispatch.cloneSelection(this.selection);
                var selectedIndex = this.selection.amenities.indexOf(amenity);
                sel.amenities.splice(selectedIndex, 1);
                this.dispatcher.call(DispatchEvent.Select, this, sel);
            }
            else {
                // Amenity is not already selected, so send out a selection event with this selected
                var sel = Dispatch.cloneSelection(this.selection);
                sel.amenities.push(amenity);
                this.dispatcher.call(DispatchEvent.Select, this, sel);
            }
        }
    };
    BaseComponent.prototype.dispatchAmenityFilter = function (amenities) {
        var filter = Dispatch.cloneFilter(this.filter);
        filter.amenities = amenities.slice();
        this.dispatcher.call(DispatchEvent.Filter, this, filter);
    };
    BaseComponent.prototype.onLoad = function (data) {
        this.data = data;
        this.filteredListings = Array.from(data.listings.values());
        this.filteredListingsMap = new Map(this.filteredListings.map(function (l) { return [l.id, l]; }));
        this.filteredNeighborhoods = Array.from(data.neighborhoods.values());
        this.filteredNeighborhoodMap = new Map(this.filteredNeighborhoods.map(function (n) { return [n.name, n]; }));
    };
    BaseComponent.prototype.onSelect = function (selection$$1) {
        this.selection = selection$$1;
        this.computeAllSelectedListings();
    };
    BaseComponent.prototype.onHighlight = function (highlight) {
        this.highlight = highlight;
    };
    BaseComponent.prototype.onFilter = function (filter) {
        this.filter = filter;
        this.filteredListings = [];
        if (filter.neighborhoods.length) {
            this.filteredNeighborhoods = filter.neighborhoods.slice();
        }
        else {
            this.filteredNeighborhoods = Array.from(this.data.neighborhoods.values());
        }
        var _loop_2 = function(listing) {
            // Don't add listings not in a filter neighborhood
            if (this_2.filter.neighborhoods.length) {
                if (this_2.filter.neighborhoods.indexOf(listing.neighborhood) === -1)
                    return "continue";
            }
            // Don't add listings not in a filter price block
            if (this_2.filter.priceBlocks.length) {
                if (this_2.filter.priceBlocks.indexOf(listing.priceBlock) === -1)
                    return "continue";
            }
            // Don't add listings not in a selected markup block
            if (this_2.filter.markupBlocks.length) {
                if (this_2.filter.markupBlocks.indexOf(listing.markupBlock) === -1)
                    return "continue";
            }
            // Don't add listings what don't have the selected amenities
            if (this_2.filter.amenities.length) {
                if (!this_2.filter.amenities.every(function (amenity) { return listing.amenities.indexOf(amenity) !== -1; }))
                    return "continue";
            }
            this_2.filteredListings.push(listing);
        };
        var this_2 = this;
        for (var _i = 0, _a = Array.from(this.data.listings.values()); _i < _a.length; _i++) {
            var listing = _a[_i];
            var state_2 = _loop_2(listing);
            if (state_2 === "continue") continue;
        }
        this.filteredListingsMap = new Map(this.filteredListings.map(function (l) { return [l.id, l]; }));
        this.filteredNeighborhoodMap = new Map(this.filteredNeighborhoods.map(function (n) { return [n.name, n]; }));
    };
    return BaseComponent;
}());

var Attribute;
(function (Attribute) {
    Attribute.count = {
        name: 'Count',
        accessor: function (l) { return 1; },
        neighborhoodAccessor: function (n) { return n.listings.length; },
        kind: 'continuous'
    };
    Attribute.rating = {
        name: 'Rating',
        accessor: function (l) { return l.reviews.rating; },
        neighborhoodAccessor: function (n) { return d3.mean(n.listings, function (l) { return l.reviews.rating; }); },
        kind: 'continuous'
    };
    Attribute.price = {
        name: 'Airbnb Daily Price',
        accessor: function (l) { return l.prices.airbnb.daily; },
        neighborhoodAccessor: function (n) { return d3.median(n.listings, function (l) { return l.prices.airbnb.daily; }); },
        kind: 'continuous'
    };
    Attribute.monthlyPrice = {
        name: 'Monthly Price Per Bedroom',
        accessor: function (l) { return l.prices.airbnb.monthly_per_bedroom; },
        neighborhoodAccessor: function (n) { return d3.median(n.listings, function (l) { return l.prices.airbnb.monthly_per_bedroom; }); },
        kind: 'continuous'
    };
    Attribute.truliaPrice = {
        name: 'Trulia Daily Price',
        accessor: function (l) { return l.prices.trulia.rent_per_bedroom / 30; },
        neighborhoodAccessor: function (n) { return d3.median(n.listings, function (l) { return (l.prices.trulia.rent_per_bedroom / 30); }); },
        kind: 'continuous'
    };
    Attribute.markup = {
        name: 'Markup',
        accessor: function (l) { return l.prices.markup_percentage; },
        neighborhoodAccessor: function (n) { return d3.median(n.listings, function (l) { return l.prices.markup_percentage; }); },
        kind: 'continuous'
    };
    Attribute.numberOfReviews = {
        name: 'Number of Reviews',
        accessor: function (l) { return l.reviews.number_of_reviews; },
        neighborhoodAccessor: function (n) { return d3.median(n.listings, function (l) { return l.reviews.number_of_reviews; }); },
        kind: 'continuous'
    };
    Attribute.numberOfHostListings = {
        name: 'Number of Host Listings',
        accessor: function (l) { return l.host_listings_count; },
        neighborhoodAccessor: function (n) { return d3.median(n.listings, function (l) { return l.host_listings_count; }); },
        kind: 'continuous'
    };
    Attribute.cancellationPolicy = {
        name: 'Cancellation Policy',
        accessor: function (l) { return l.cancellation_policy; },
        neighborhoodAccessor: function (n) { return n.listings[0].cancellation_policy; },
        kind: 'ordinal',
        listingDomain: function (data) { return ['flexible', 'moderate', 'strict', 'super_strict_30', 'super_strict_60']; },
        neighborhoodDomain: function (data) { return ['flexible', 'moderate', 'strict', 'super_strict_30', 'super_strict_60']; }
    };
    Attribute.numberOfGuestIncluded = {
        name: 'Number of Guest Included',
        accessor: function (l) { return l.guests_included; },
        neighborhoodAccessor: function (n) { return d3.median(n.listings, function (l) { return l.guests_included; }); },
        kind: 'continuous'
    };
    // Set default domain accessors
    var _loop_1 = function(attr) {
        attr.listingDomain = function (data) { return d3.extent(data, function (d) { return attr.accessor(d); }); };
        attr.neighborhoodDomain = function (data) { return d3.extent(data, function (d) { return attr.neighborhoodAccessor(d); }); };
    };
    for (var _i = 0, _a = [Attribute.count, Attribute.rating, Attribute.price, Attribute.monthlyPrice, Attribute.markup, Attribute.truliaPrice, Attribute.numberOfReviews, Attribute.numberOfHostListings, Attribute.numberOfGuestIncluded]; _i < _a.length; _i++) {
        var attr = _a[_i];
        _loop_1(attr);
    }
})(Attribute || (Attribute = {}));

var NeighborhoodMapComponent = (function (_super) {
    __extends(NeighborhoodMapComponent, _super);
    function NeighborhoodMapComponent(selector, dispatcher) {
        _super.call(this, selector, dispatcher);
        // Initialize our canvas
        var width = this.element.clientWidth, height = this.element.clientHeight;
        this.view = {};
        this.view.moneyFormat = d3.format('$.2f');
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'map-chart')
            .attr('width', width)
            .attr('height', height);
        this.view.pathsContainer = this.view.svg.append('g')
            .attr('class', 'map-container')
            .attr('transform', 'translate(0 -20)');
    }
    NeighborhoodMapComponent.prototype.initializeLegend = function () {
        var _this = this;
        var width = this.element.clientWidth, height = this.element.clientHeight;
        var legendGroup = this.view.svg
            .append('g')
            .attr('class', 'legend')
            .attr('transform', "translate(10, " + (height - 30) + ")");
        var legendItems = [
            { representative: 0, text: '$0 - $200', min: 0, max: 200 },
            { representative: 200, text: '$200 - $300', min: 200, max: 300 },
            { representative: 300, text: '$300 - $400', min: 300, max: 400 },
            { representative: 400, text: '$400 - $600', min: 400, max: 600 },
            { representative: 600, text: '$600 - $1000', min: 600, max: 1000 },
            { representative: 1000, text: '$1000 - $1600', min: 1000, max: 1600 }
        ];
        var itemWidth = (width - 20) / legendItems.length;
        var rectSize = 12;
        var itemSelection = legendGroup
            .selectAll('g.legend-item')
            .data(legendItems);
        var itemEnter = itemSelection
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', function (d, i) { return ("translate(" + i * itemWidth + ", 0)"); });
        itemEnter
            .append('rect')
            .attr('width', rectSize)
            .attr('height', rectSize)
            .style('fill', function (d) { return _this.getColor(d.representative); });
        itemEnter
            .append('text')
            .text(function (d) { return d.text; })
            .attr('x', rectSize + 2)
            .attr('y', rectSize / 2);
        this.view.legend = itemSelection.merge(itemEnter);
    };
    NeighborhoodMapComponent.prototype.onLoad = function (data) {
        _super.prototype.onLoad.call(this, data);
        this.initializeLegend();
        this.render();
    };
    NeighborhoodMapComponent.prototype.onSelect = function (selection$$1) {
        var _this = this;
        _super.prototype.onSelect.call(this, selection$$1);
        this.view.paths.attr('fill', function (d) { return _this.getNeighborhoodRegion(_this.filteredNeighborhoodMap.get(d.properties.neighborho)); });
    };
    NeighborhoodMapComponent.prototype.onHighlight = function (highlight) {
        var _this = this;
        _super.prototype.onHighlight.call(this, highlight);
        this.view.paths.attr('fill', function (d) { return _this.getNeighborhoodRegion(_this.filteredNeighborhoodMap.get(d.properties.neighborho)); });
    };
    NeighborhoodMapComponent.prototype.onFilter = function (filter) {
        var _this = this;
        _super.prototype.onFilter.call(this, filter);
        this.view.paths.attr('fill', function (d) { return _this.getNeighborhoodRegion(_this.filteredNeighborhoodMap.get(d.properties.neighborho)); });
    };
    NeighborhoodMapComponent.prototype.resize = function () {
    };
    NeighborhoodMapComponent.prototype.getNeighborhoodRegion = function (neighborhood) {
        if (neighborhood == undefined) {
            return 'grey';
        }
        // Any highlighted neighborhood should always be red
        if ((neighborhood === this.highlight.neighborhood) || (this.highlight.listing && this.highlight.listing.neighborhood === neighborhood)) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        // There is a selection but it yields no listings
        if (!Dispatch.isEmptySelection(this.selection) && this.allSelectedListings.length === 0) {
            return this.shadeOfGreen(neighborhood);
        }
        // The neighborhood is selected
        if (this.selection.neighborhoods.indexOf(neighborhood) !== -1) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        // Some of the selected listings belong in this neighborhood
        if (this.selection.listings.length && this.allSelectedListings.some(function (l) { return l.neighborhood === neighborhood; })) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        return this.shadeOfGreen(neighborhood);
    };
    //returns shade of green
    NeighborhoodMapComponent.prototype.shadeOfGreen = function (neighborhood) {
        var average = Attribute.price.neighborhoodAccessor(neighborhood);
        return this.getColor(average);
    };
    //return green based on price
    //color scale: https://color.adobe.com/greens-color-theme-7334761/edit/?copy=true&base=2&rule=Custom&selected=4&name=Copy%20of%20greens&mode=hsv&rgbvalues=0,0.15,0.09999959999997828,0.013500000000000014,0.27,0.14602431599999785,0.07820000000000002,0.46,0.20546692119988363,0.21170000000000003,0.73,0.2721690243998254,0.49455095400014937,0.9,0.423&swatchOrder=0,1,2,3,4 for each green
    NeighborhoodMapComponent.prototype.getColor = function (averageNeighborhoodPrice) {
        if (averageNeighborhoodPrice >= 0 && averageNeighborhoodPrice < 200) {
            return 'rgb(204,236,230)';
        }
        else if (averageNeighborhoodPrice >= 200 && averageNeighborhoodPrice < 300) {
            return 'rgb(153,216,201)';
        }
        else if (averageNeighborhoodPrice >= 300 && averageNeighborhoodPrice < 400) {
            return 'rgb(102,194,164)';
        }
        else if (averageNeighborhoodPrice >= 400 && averageNeighborhoodPrice < 600) {
            return 'rgb(65,174,118)';
        }
        else if (averageNeighborhoodPrice >= 600 && averageNeighborhoodPrice < 1000) {
            return 'rgb(35,139,69)';
        }
        else if (averageNeighborhoodPrice >= 1000 && averageNeighborhoodPrice < 1600) {
            return 'rgb(0,88,36)';
        }
        return 'rgb(38,38,38)';
    };
    NeighborhoodMapComponent.prototype.getNeighborhoodAverages = function () {
    };
    NeighborhoodMapComponent.prototype.render = function () {
        var _this = this;
        var self = this;
        var width = this.element.clientWidth, height = this.element.clientHeight;
        var projection = d3.geoMercator()
            .scale(1)
            .translate([0, 0])
            .precision(0);
        var path = d3.geoPath().projection(projection);
        var bounds = path.bounds(this.data.geo);
        var xScale = width / Math.abs(bounds[1][0] - bounds[0][0]);
        var yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);
        var scale = xScale < yScale ? xScale : yScale;
        var transl = [
            (width - scale * (bounds[1][0] + bounds[0][0])) / 2,
            (height - scale * (bounds[1][1] + bounds[0][1])) / 2
        ];
        projection
            .scale(scale)
            .translate(transl);
        var pathsSelection = this.view.pathsContainer.selectAll('path')
            .data(this.data.geo.features, function (d) { return d['id']; });
        // Draw all the neighborhoods for the first time
        var pathsEnter = pathsSelection.enter()
            .append('path')
            .attr('d', path)
            .attr('data-id', function (d) { return d.id; })
            .attr('data-name', function (d) { return d.properties.neighborho; })
            .attr('fill', function (d) { return _this.getNeighborhoodRegion(_this.filteredNeighborhoodMap.get(d.properties.neighborho)); })
            .style('stroke', '#FFFFFF')
            .on('mouseenter', function (d) {
            // If this neighborhood was filtered out, do nothing
            if (!self.filteredNeighborhoodMap.has(d.properties.neighborho))
                return;
            // Dispatch a highlight event for this neighborhood
            var selectedNeighborhood = self.filteredNeighborhoodMap.get(d.properties.neighborho);
            self.dispatchNeighborhoodHighlight(selectedNeighborhood, true);
            // let sel = d3.select(this);
            // // Scale up the particular neighborhood. 
            // sel.moveToFront();
            // let box = (sel.node() as SVGPathElement).getBBox();
            // // Do some really naive clamping to get already large neighborhood slightly scaled,
            // // and teeny tiny neighborhoods more highly scaled. The 2500 figures from a bounding
            // // box of approximately 50x50. Scale factor remains in range [1.5, 2.5].
            // let scale = Math.min(2.5, Math.max(1.5, 2500 / (box.width * box.height)));
            // let cx = box.x + box.width/2;
            // let cy = box.y + box.height/2;
            // sel.transition()
            //     .style('transform', `translate(-${(scale - 1) * cx}px, -${(scale - 1) * cy}px) scale(${scale})`);
        })
            .on('mouseleave', function (d) {
            // If this neighborhood was filtered out, do nothing
            if (!self.filteredNeighborhoodMap.has(d.properties.neighborho))
                return;
            // Dispatch an empty highlight event
            var selectedNeighborhood = self.filteredNeighborhoodMap.get(d.properties.neighborho);
            self.dispatchNeighborhoodHighlight(selectedNeighborhood, false);
            // let sel = d3.select(this);
            // sel.transition()
            //     .style('transform', `translate(0px, 0px) scale(1.0)`)
            //     .on('end', () => sel.moveToBack());
        }).on('click', function (d) {
            // If this neighborhood was filtered out, do nothing
            if (!self.filteredNeighborhoodMap.has(d.properties.neighborho))
                return;
            var selectedNeighborhood = self.filteredNeighborhoodMap.get(d.properties.neighborho);
            self.dispatchNeighborhoodSelection(selectedNeighborhood, !d3.event.shiftKey);
        });
        //label each neighborhood
        //TODO: tidy label up 
        var labelSelection = this.view.pathsContainer
            .selectAll('g.map-label')
            .data(this.data.geo.features);
        var labelEnter = labelSelection.enter()
            .append('g')
            .attr('class', 'map-label')
            .attr('transform', function (d) {
            var _a = path.centroid(d), x = _a[0], y = _a[1];
            return "translate(" + x + " " + (y - 12) + ")";
        })
            .append('text')
            .attr('x', 0)
            .attr('y', 0);
        labelEnter.append('tspan')
            .attr('class', 'map-label-name')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(function (d) { return d.properties.neighborho; });
        labelEnter.append('tspan')
            .attr('class', 'map-label-price')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(function (d) {
            var neighborhood = _this.data.neighborhoods.get(d.properties.neighborho);
            if (neighborhood) {
                return _this.view.moneyFormat(Attribute.price.neighborhoodAccessor(neighborhood));
            }
            else {
                return '';
            }
        });
        // Create the update selection
        this.view.paths = pathsEnter.merge(pathsSelection);
    };
    return NeighborhoodMapComponent;
}(BaseComponent));

var ListingBlocksComponent = (function (_super) {
    __extends(ListingBlocksComponent, _super);
    function ListingBlocksComponent(selector, dispatcher) {
        _super.call(this, selector, dispatcher);
        // Initialize our canvas
        var width = this.element.clientWidth;
        var height = this.element.clientHeight;
        this.view = {};
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height);
        this.view.priceColorScale = d3.scaleLinear().range(['#ffffff', '#386fa4']);
        this.view.markupColorScale = d3.scaleLinear().range(['#ffffff', '#386fa4']);
    }
    ListingBlocksComponent.prototype.interpolateRed = function (t) {
        return d3.hsl(0.0, 1.0, 1.0 - t / 2) + '';
    };
    ListingBlocksComponent.prototype.onLoad = function (data) {
        _super.prototype.onLoad.call(this, data);
        this.render();
    };
    ListingBlocksComponent.prototype.onSelect = function (selection$$1) {
        _super.prototype.onSelect.call(this, selection$$1);
        this.updateColors();
        this.updateListings();
    };
    ListingBlocksComponent.prototype.onHighlight = function (highlight) {
        _super.prototype.onHighlight.call(this, highlight);
        this.updateColors();
        this.updateListings();
    };
    ListingBlocksComponent.prototype.onFilter = function (filter) {
        _super.prototype.onFilter.call(this, filter);
        this.updateColors();
        this.updateListings();
    };
    ListingBlocksComponent.prototype.resize = function () {
    };
    ListingBlocksComponent.prototype.isBlockEnabled = function (block) {
        if (block.type === 'price' && this.filter.priceBlocks.length && this.filter.priceBlocks.indexOf(block) === -1) {
            return false;
        }
        else if (block.type === 'markup' && this.filter.markupBlocks.length && this.filter.markupBlocks.indexOf(block) === -1) {
            return false;
        }
        return true;
    };
    ListingBlocksComponent.prototype.updateListings = function () {
        // If any price blocks are selected, draw those listings
        var selectedPriceBlocks = this.selection.priceBlocks || [];
        var selectedMarkupBlocks = this.selection.markupBlocks || [];
        if (Dispatch.isOnlyListingSelection(this.selection) && this.selection.listings.length === 1) {
            var listing = this.selection.listings[0];
            selectedPriceBlocks = [listing.priceBlock];
            selectedMarkupBlocks = [listing.markupBlock];
        }
        else if (Dispatch.isEmptySelection(this.selection) && this.highlight.listing) {
            var listing = this.highlight.listing;
            selectedPriceBlocks = [listing.priceBlock];
            selectedMarkupBlocks = [listing.markupBlock];
        }
        var allPriceBlocks = (this.filter.priceBlocks.length) ? this.filter.priceBlocks : this.data.priceBlocks;
        var allMarkupBlocks = (this.filter.markupBlocks.length) ? this.filter.markupBlocks : this.data.markupBlocks;
        if (selectedPriceBlocks.length !== 0 || selectedMarkupBlocks.length !== 0) {
            for (var _i = 0, allPriceBlocks_1 = allPriceBlocks; _i < allPriceBlocks_1.length; _i++) {
                var block = allPriceBlocks_1[_i];
                if (selectedPriceBlocks.indexOf(block) !== -1) {
                    this.drawListingsWithinBlock(block);
                }
                else {
                    this.hideListingsWithinBlock(block);
                }
            }
            for (var _a = 0, allMarkupBlocks_1 = allMarkupBlocks; _a < allMarkupBlocks_1.length; _a++) {
                var block = allMarkupBlocks_1[_a];
                if (selectedMarkupBlocks.indexOf(block) !== -1) {
                    this.drawListingsWithinBlock(block);
                }
                else {
                    this.hideListingsWithinBlock(block);
                }
            }
        }
        else {
            this.hideListingsWithinAllBlocks();
        }
    };
    ListingBlocksComponent.prototype.updateColors = function () {
        var _this = this;
        var priceCounts = Array(this.data.priceBlocks.length).fill(0);
        var markupCounts = Array(this.data.markupBlocks.length).fill(0);
        var displayedListings = this.allSelectedListings;
        if (this.allSelectedListings.length === 0 && Dispatch.isEmptySelection(this.selection)) {
            if (this.highlight.neighborhood)
                displayedListings = this.highlight.neighborhood.listings;
        }
        // Update the counts for our given listings
        for (var _i = 0, displayedListings_1 = displayedListings; _i < displayedListings_1.length; _i++) {
            var listing = displayedListings_1[_i];
            priceCounts[listing.priceBlock.number] += 1;
            markupCounts[listing.markupBlock.number] += 1;
        }
        // Create the fill color function
        var blockFill = function (block) {
            if (!_this.isBlockEnabled(block)) {
                return 'grey';
            }
            else if (displayedListings.length === 0) {
                return 'white';
            }
            else {
                if (block.type === 'price') {
                    if (_this.selection.priceBlocks.length || (Dispatch.isOnlyListingSelection(_this.selection) && _this.selection.listings.length === 1)) {
                        return 'white';
                    }
                    else {
                        return _this.view.priceColorScale(priceCounts[block.number]);
                    }
                }
                else {
                    if (_this.selection.markupBlocks.length || (Dispatch.isOnlyListingSelection(_this.selection) && _this.selection.listings.length === 1)) {
                        return 'white';
                    }
                    else {
                        return _this.view.markupColorScale(markupCounts[block.number]);
                    }
                }
            }
        };
        // Highlight the neighborhoods in the blocks
        this.view.priceColorScale.domain(d3.extent(priceCounts));
        this.view.markupColorScale.domain(d3.extent(markupCounts));
        this.view.priceBlockGroups
            .transition().duration(500)
            .select('rect.block-rect')
            .attr('fill', blockFill);
        this.view.markupBlockGroups
            .transition().duration(500)
            .select('rect.block-rect')
            .attr('fill', blockFill);
    };
    ListingBlocksComponent.prototype.hideListingsWithinBlock = function (block) {
        var allGroups = (block.type === 'price') ? this.view.priceBlockGroups : this.view.markupBlockGroups;
        allGroups.filter(function (d) { return d.number === block.number; })
            .selectAll('rect.listing-bar')
            .attr('pointer-events', 'none')
            .transition().duration(200)
            .attr('opacity', 0);
    };
    ListingBlocksComponent.prototype.hideListingsWithinAllOtherBlocks = function (block) {
        var allBlocks;
        if (block.type === 'price') {
            allBlocks = (this.filter.priceBlocks.length) ? this.filter.priceBlocks : this.data.priceBlocks;
        }
        else {
            allBlocks = (this.filter.markupBlocks.length) ? this.filter.markupBlocks : this.data.markupBlocks;
        }
        for (var _i = 0, allBlocks_1 = allBlocks; _i < allBlocks_1.length; _i++) {
            var other = allBlocks_1[_i];
            if (block !== other)
                this.hideListingsWithinBlock(other);
        }
    };
    ListingBlocksComponent.prototype.hideListingsWithinAllBlocks = function () {
        var priceBlocks = (this.filter.priceBlocks.length) ? this.filter.priceBlocks : this.data.priceBlocks;
        var markupBlocks = (this.filter.markupBlocks.length) ? this.filter.markupBlocks : this.data.markupBlocks;
        for (var _i = 0, priceBlocks_1 = priceBlocks; _i < priceBlocks_1.length; _i++) {
            var block = priceBlocks_1[_i];
            this.hideListingsWithinBlock(block);
        }
        for (var _a = 0, markupBlocks_1 = markupBlocks; _a < markupBlocks_1.length; _a++) {
            var block = markupBlocks_1[_a];
            this.hideListingsWithinBlock(block);
        }
    };
    ListingBlocksComponent.prototype.drawListingsWithinBlock = function (block, highlightedListing) {
        var _this = this;
        if (!this.isBlockEnabled(block))
            return;
        var thisGroups = (block.type === 'price') ? this.view.priceBlockGroups : this.view.markupBlockGroups;
        var otherGroups = (block.type === 'price') ? this.view.markupBlockGroups : this.view.priceBlockGroups;
        var thisKey = (block.type === 'price') ? 'priceBlock' : 'markupBlock';
        var otherBlockKey = (block.type === 'price') ? 'markupBlock' : 'priceBlock';
        var blockGroup = thisGroups.filter(function (d) { return d.number === block.number; });
        var blockRect = blockGroup.select('rect.block-rect');
        var height = parseFloat(blockRect.attr('height'));
        var width = parseFloat(blockRect.attr('width'));
        var x = parseFloat(blockRect.attr('x'));
        var y = parseFloat(blockRect.attr('y'));
        // Create the height scale for this block
        var minimum = block.minimum;
        var maximum = isNaN(block.maximum) ? d3.max(block.listings, function (l) { return Block.value(block, l); }) : block.maximum;
        var scaleHeight = d3.scaleLinear()
            .domain([minimum, maximum])
            .range([height * 0.1, height]);
        var barWidth = width / block.listings.length;
        var barFill = function (listing, highlight) {
            // If the listing was filtered out, show nothing
            if (_this.filteredListings.indexOf(listing) === -1)
                return 'white';
            // If the listing is only single listing selected
            if (Dispatch.isOnlyListingSelection(_this.selection) && _this.selection.listings.length === 1 && _this.selection.listings[0] === listing)
                return 'red';
            // If nothing is selected and this listing is highlighted
            if (Dispatch.isEmptySelection(_this.selection) && _this.highlight.listing === listing)
                return 'red';
            // If the listing is highlighted
            if (listing === highlight)
                return 'red';
            return '#ccc';
        };
        var debouncedUpdateColor = (function () {
            var timeout = 0;
            var wait = 100;
            var self = _this;
            return function (cancel) {
                if (cancel === void 0) { cancel = false; }
                clearTimeout(timeout);
                if (!cancel)
                    timeout = setTimeout(function () { return self.updateColors(); }, wait);
            };
        })();
        var listingBarsSelection = blockGroup
            .selectAll('rect.listing-bar')
            .data(block.listings);
        var listingBarsEnter = listingBarsSelection.enter()
            .append('rect')
            .attr('class', 'listing-bar')
            .attr('fill', function (d) { return barFill(d, highlightedListing); })
            .attr('width', barWidth)
            .attr('x', function (d, i) { return i * barWidth; })
            .attr('height', function (d) { return scaleHeight(Block.value(block, d)); })
            .attr('y', function (d) { return y + (height - scaleHeight(Block.value(block, d))); })
            .on('mouseenter', function (l) {
            // Dispatch a listing highlight
            if (_this.filteredListings.indexOf(l) !== -1) {
                otherGroups.selectAll('rect.listing-bar').attr('fill', function (d) { return barFill(d, l); });
                _this.drawListingsWithinBlock(l[otherBlockKey], l);
                debouncedUpdateColor(true);
                thisGroups
                    .filter(function (d) { return _this.isBlockEnabled(d); })
                    .selectAll('rect.listing-bar')
                    .attr('fill', function (d) { return barFill(d, l); });
                otherGroups
                    .filter(function (d) { return _this.isBlockEnabled(d); })
                    .selectAll('rect.block-rect')
                    .attr('fill', 'white');
            }
        })
            .on('mouseleave', function (l) {
            // Dispatch a listing un-highlight
            if (_this.filteredListings.indexOf(l) !== -1) {
                thisGroups
                    .filter(function (d) { return _this.isBlockEnabled(d); })
                    .selectAll('rect.listing-bar')
                    .attr('fill', function (d) { return barFill(d, undefined); });
                _this.hideListingsWithinBlock(l[otherBlockKey]);
                debouncedUpdateColor();
            }
        })
            .on('click', function (l) {
            if (_this.filteredListings.indexOf(l) !== -1)
                _this.dispatchListingSelection(l, !d3.event.shiftKey);
        });
        var listingBarsUpdate = listingBarsSelection.merge(listingBarsEnter);
        listingBarsUpdate
            .attr('pointer-events', 'auto')
            .transition().duration(200)
            .attr('opacity', 1)
            .attr('fill', function (d) { return barFill(d, highlightedListing); });
    };
    ListingBlocksComponent.prototype.render = function () {
        var _this = this;
        var self = this;
        var padding = 5;
        var sectionLabelWidth = 50;
        var width = this.element.clientWidth - sectionLabelWidth;
        var height = this.element.clientHeight;
        var priceBlockSectionLabel = this.view.svg.select('text.price-block-label');
        if (priceBlockSectionLabel.empty()) {
            priceBlockSectionLabel = this.view.svg.append('text')
                .attr('class', 'price-block-label')
                .style('font-size', '10px');
            priceBlockSectionLabel.append('tspan')
                .attr('x', padding)
                .attr('dy', '-1em')
                .text('Airbnb');
            priceBlockSectionLabel.append('tspan')
                .attr('x', padding)
                .attr('dy', '1em')
                .text('Price:');
        }
        priceBlockSectionLabel
            .attr('x', padding)
            .attr('y', height / 6 + height / 6);
        var markupBlockSectionLabel = this.view.svg.select('text.markup-block-label');
        if (markupBlockSectionLabel.empty()) {
            markupBlockSectionLabel = this.view.svg.append('text')
                .attr('class', 'markup-block-label')
                .style('font-size', '10px')
                .text('Markup:');
        }
        markupBlockSectionLabel
            .attr('x', padding)
            .attr('y', height / 2 + height / 6 + padding);
        var blockHeight = height / 3;
        var blockWidth = function (block) {
            return Math.max(width * block.listings.length / _this.data.listings.size - padding, 1);
        };
        var blockX = function (block) {
            return sectionLabelWidth + padding + width * block.listingsStartIndex / _this.data.listings.size;
        };
        var blockLabel = function (block) {
            var label = block.minimum.toFixed(0);
            if (isNaN(block.maximum))
                label += '+';
            if (block.type === 'price') {
                label = '$' + label;
            }
            else {
                label += '%';
            }
            return label;
        };
        var priceBlocksSelection = this.view.svg
            .selectAll('g.price-block')
            .data(this.data.priceBlocks);
        var priceBlocksEnter = priceBlocksSelection.enter().append('g').attr('class', 'price-block');
        priceBlocksEnter.append('text').attr('class', 'block-label');
        priceBlocksEnter
            .append('rect')
            .attr('class', 'block-rect')
            .on('click', function (d) {
            if (_this.isBlockEnabled(d))
                _this.dispatchBlockSelection(d, !d3.event.shiftKey);
        });
        this.view.priceBlockGroups = priceBlocksSelection.merge(priceBlocksEnter);
        this.view.priceBlockGroups.style('transform', function (d) { return ("translate(" + blockX(d) + "px, " + -padding + "px)"); });
        this.view.priceBlockGroups
            .select('rect.block-rect')
            .attr('height', blockHeight)
            .attr('width', blockWidth)
            .attr('y', height / 6)
            .attr('fill', 'white')
            .style('stroke', '#888')
            .style('stroke-width', 1);
        this.view.priceBlockGroups
            .select('text.block-label')
            .attr('x', function (d) { return blockWidth(d) / 2; })
            .attr('y', height / 12 + height / 24)
            .text(blockLabel)
            .style('text-anchor', 'middle')
            .style('font-size', '10px');
        var markupBlocksSelection = this.view.svg
            .selectAll('g.markup-block')
            .data(this.data.markupBlocks);
        var markupBlocksEnter = markupBlocksSelection.enter().append('g').attr('class', 'markup-block');
        markupBlocksEnter.append('text').attr('class', 'block-label');
        markupBlocksEnter.append('rect')
            .attr('class', 'block-rect')
            .on('click', function (d) {
            if (_this.isBlockEnabled(d))
                _this.dispatchBlockSelection(d, !d3.event.shiftKey);
        });
        this.view.markupBlockGroups = markupBlocksSelection.merge(markupBlocksEnter);
        this.view.markupBlockGroups.style('transform', function (d) { return ("translate(" + blockX(d) + "px, " + (padding + height / 2) + "px)"); });
        this.view.markupBlockGroups
            .select('rect.block-rect')
            .attr('height', blockHeight)
            .attr('width', blockWidth)
            .attr('y', 0)
            .attr('fill', 'white')
            .style('stroke', '#888')
            .style('stroke-width', 1);
        this.view.markupBlockGroups
            .select('text.block-label')
            .attr('x', function (d) { return blockWidth(d) / 2; })
            .attr('y', height / 2 - height / 12)
            .text(blockLabel)
            .style('text-anchor', 'middle')
            .style('font-size', '10px');
    };
    return ListingBlocksComponent;
}(BaseComponent));

var ScatterPlotComponent = (function (_super) {
    __extends(ScatterPlotComponent, _super);
    function ScatterPlotComponent(selector, dispatcher) {
        _super.call(this, selector, dispatcher);
        // Initialize our canvas
        var width = this.element.clientWidth;
        var height = this.element.clientHeight;
        this.view = {};
        this.view.padding = new Padding(40);
        this.view.title = d3.select(this.element.parentElement).select('.title .text');
        this.view.overlay = d3.select(this.selector).select('.overlay');
        this.view.overlay
            .append('div')
            .attr('class', 'top-left')
            .style('top', '5px');
        this.view.overlay
            .select('div.top-left')
            .append('button')
            .attr('class', 'reset-zoom')
            .text('Reset Zoom');
        this.view.svg = d3.select(this.selector).append('svg')
            .attr('class', 'chart')
            .attr('width', width)
            .attr('height', height);
        this.attributeMap = [];
        this.attributeMap.push(Attribute.price);
        this.attributeMap.push(Attribute.truliaPrice);
        this.attributeMap.push(Attribute.monthlyPrice);
        this.attributeMap.push(Attribute.rating);
        this.attributeMap.push(Attribute.cancellationPolicy);
        this.attributeMap.push(Attribute.numberOfReviews);
        this.attributeMap.push(Attribute.numberOfGuestIncluded);
        // Select the default quadrant names
        this.quadrantNames = [undefined, undefined, undefined, undefined];
        // Select the rating attribute by default
        this.selectedAttribute = this.attributeMap[0];
        this.selectedLevel = 'Neighborhoods';
        this.updateTitle();
    }
    ScatterPlotComponent.prototype.initializeQuadrants = function () {
        var quadrantsArea = this.view.svg
            .append('g').attr('class', 'quadrant-area');
        this.view.quadrantLineHorizontal = quadrantsArea
            .append('g').attr('class', 'quadrant-lines quadrant-horizontal')
            .append('line');
        this.view.quadrantLineVertical = quadrantsArea
            .append('g').attr('class', 'quadrant-lines quadrant-vertical')
            .append('line');
        var quadrantLabelsSelection = quadrantsArea
            .append('g').attr('class', 'quadrant-labels')
            .selectAll('text')
            .data(this.quadrantNames);
        var quadrantLabelsEnter = quadrantLabelsSelection.enter()
            .append('text')
            .text(function (d) { return d; });
        this.view.quadrantLabels = quadrantLabelsSelection.merge(quadrantLabelsEnter);
    };
    ScatterPlotComponent.prototype.initializeAxes = function () {
        var _this = this;
        // Create the axis elements
        this.view.svg.append('g').attr('class', 'markup-axis');
        this.view.svg.append('g').attr('class', 'other-axis');
        this.view.svg
            .append('g').attr('class', 'axis-label markup-axis-label')
            .append('text').text('Markup Percentage').style('transform', 'rotate(-90deg)');
        var attributeSelect = this.view.overlay
            .append('div').attr('class', 'axis-label other-axis-label')
            .append('select');
        var attributeOptionsSelection = attributeSelect.selectAll('option').data(this.attributeMap);
        var attributeOptionsEnter = attributeOptionsSelection.enter()
            .append('option')
            .text(function (d) { return d.name; })
            .attr('selected', function (d) { return d === _this.selectedAttribute ? true : undefined; });
        var attributeOptions = attributeOptionsSelection.merge(attributeOptionsEnter);
        attributeSelect.on('change', function () {
            var index = attributeSelect.property('selectedIndex');
            var attribute = attributeOptions.filter(function (d, i) { return i == index; }).datum();
            // Update the scales for this attribute and re-render
            _this.selectedAttribute = attribute;
            _this.updateScales();
            _this.render();
        });
    };
    ScatterPlotComponent.prototype.initializeLevelSelect = function () {
        var _this = this;
        var levelSelect = this.view.overlay.select('div.top-left')
            .append('select')
            .attr('class', 'level-select');
        var levelOptionsSelection = levelSelect.selectAll('option').data(['Neighborhoods', 'Listings']);
        var levelOptionsEnter = levelOptionsSelection.enter()
            .append('option')
            .text(function (d) { return d; })
            .attr('selected', function (d) { return d === _this.selectedLevel ? true : undefined; });
        var levelOptions = levelOptionsSelection.merge(levelOptionsEnter);
        levelSelect.on('change', function () {
            var index = levelSelect.property('selectedIndex');
            var level = levelOptions.filter(function (d, i) { return i === index; }).datum();
            _this.selectedLevel = level;
            _this.render();
        });
    };
    ScatterPlotComponent.prototype.initializeDrag = function () {
        var _this = this;
        this.view.dragArea = this.view.circlesContainerRoot;
        this.view.dragArea
            .select('rect.backfill')
            .call(d3.drag()
            .filter(function () { return !event['altKey']; })
            .subject(function () { return [[d3.event.x, d3.event.y], [d3.event.x, d3.event.y]]; })
            .on('start', function () { return _this.selectionDragStarted(); }));
    };
    ScatterPlotComponent.prototype.selectionDragStarted = function () {
        var _this = this;
        var self = this;
        // Get the list of data positions of this path
        var d = d3.event.subject;
        // Get the drag boundaries, and offsets
        var offsetX = +this.view.dragArea.attr('data-offset-x');
        var offsetY = +this.view.dragArea.attr('data-offset-y');
        var width = +this.view.dragArea.select('rect.backfill').attr('width');
        var height = +this.view.dragArea.select('rect.backfill').attr('height');
        // Get the drag position
        var x0 = Math.max(0, Math.min(width, d3.event.x));
        var y0 = Math.max(0, Math.min(height, d3.event.y));
        var didMove = false;
        var rectLeft = 0;
        var rectTop = 0;
        var rectWidth = 0;
        var rectHeight = 0;
        // Determine whether the resulting selection should be new or appended
        var newSelection = !d3.event.sourceEvent.shiftKey;
        var rect = this.view.dragArea
            .append('rect')
            .attr('class', 'drag-selection');
        d3.event
            .on('drag', function () {
            didMove = true;
            var x1 = Math.max(0, Math.min(width, d3.event.x));
            var y1 = Math.max(0, Math.min(height, d3.event.y));
            rectLeft = Math.min(x0, x1);
            rectTop = Math.min(y0, y1);
            rectWidth = Math.abs(x1 - x0);
            rectHeight = Math.abs(y1 - y0);
            rect.attr('x', rectLeft)
                .attr('y', rectTop)
                .attr('width', rectWidth)
                .attr('height', rectHeight);
        })
            .on('end', function () {
            if (!didMove) {
                rectLeft = x0;
                rectTop = y0;
            }
            // Select the actual elements
            var svgNode = _this.view.svg.node();
            var rectNode = rect.node();
            var selectionRect = svgNode.createSVGRect();
            selectionRect.x = rectLeft + offsetX;
            selectionRect.y = rectTop + offsetY;
            selectionRect.width = rectWidth;
            selectionRect.height = rectHeight;
            var nodes = svgNode.getIntersectionList(selectionRect, null);
            if (_this.selectedLevel === 'Neighborhoods') {
                var neighborhoods = [];
                var selection$$1 = void 0;
                for (var i = 0; i < nodes.length; i++) {
                    var data = nodes.item(i)['__data__'];
                    // Current selected node is a neighborhood
                    if (data && data['listings'] !== undefined) {
                        neighborhoods.push(data);
                    }
                }
                if (newSelection) {
                    // Overwrite the selection with the selected neighborhoods
                    selection$$1 = Dispatch.emptySelection();
                    selection$$1.neighborhoods = neighborhoods;
                }
                else {
                    // Add any newly selected neighborhoods to the selection
                    selection$$1 = Dispatch.cloneSelection(_this.selection);
                    for (var _i = 0, neighborhoods_1 = neighborhoods; _i < neighborhoods_1.length; _i++) {
                        var n = neighborhoods_1[_i];
                        if (selection$$1.neighborhoods.indexOf(n) === -1)
                            selection$$1.neighborhoods.push(n);
                    }
                }
                _this.dispatcher.call(DispatchEvent.Select, _this, selection$$1);
            }
            else {
                var listings = [];
                var selection$$1 = void 0;
                for (var i = 0; i < nodes.length; i++) {
                    var data = nodes.item(i)['__data__'];
                    // Current selected node is a listing
                    if (data && data['neighborhood'] !== undefined) {
                        listings.push(data);
                    }
                }
                if (newSelection) {
                    // Overwrite the selection with the selected listings
                    selection$$1 = Dispatch.emptySelection();
                    selection$$1.listings = listings;
                }
                else {
                    // Add any newly selected listings to the selection
                    selection$$1 = Dispatch.cloneSelection(_this.selection);
                    for (var _a = 0, listings_1 = listings; _a < listings_1.length; _a++) {
                        var l = listings_1[_a];
                        if (selection$$1.listings.indexOf(l) === -1)
                            selection$$1.listings.push(l);
                    }
                }
                _this.dispatcher.call(DispatchEvent.Select, _this, selection$$1);
            }
            // Remove the path from existence
            // path.remove();
            rect.remove();
        });
    };
    ScatterPlotComponent.prototype.initializeCircles = function () {
        this.view.circlesContainerGroup = this.view.svg.append('g').attr('class', 'circles-container');
        this.view.circlesContainerRoot = this.view.circlesContainerGroup.append('svg');
        this.view.circlesContainerRoot.append('rect').attr('class', 'backfill').style('cursor', 'crosshair');
        this.view.circlesContainerInner = this.view.circlesContainerRoot.append('g');
    };
    ScatterPlotComponent.prototype.initializeZoom = function () {
        var self = this;
        var zoom$$1 = d3.zoom()
            .filter(function () {
            // Only allow zooming on scroll wheel, or panning on alt-click
            if (event instanceof WheelEvent)
                return true;
            else if (event instanceof MouseEvent)
                return event.button === 0 && event.altKey;
            else
                return false;
        })
            .on('zoom', function () {
            var transform = d3.event.transform;
            var markupAxis;
            var otherAxis;
            if (self.selectedAttribute.kind === 'continuous') {
                transform = d3.event.transform;
                markupAxis = d3.axisLeft(self.view.markupScale).scale(transform.rescaleY(self.view.markupScale));
                otherAxis = d3.axisBottom(self.view.otherScale).scale(transform.rescaleX(self.view.otherScale));
            }
            else {
                transform = d3.zoomIdentity;
                markupAxis = d3.axisLeft(self.view.markupScale).scale(transform.rescaleY(self.view.markupScale));
                otherAxis = d3.axisBottom(self.view.otherScale);
            }
            //update axis
            self.view.svg.select('g.other-axis').call(otherAxis);
            self.view.svg.select('g.markup-axis').call(markupAxis);
            //zoom to neighborhoods
            if (self.view.neighborhoodCircles) {
                self.view.neighborhoodCircles
                    .attr('transform', transform + '')
                    .attr('r', function (d) { return self.view.sizeScale(Attribute.count.neighborhoodAccessor(d)) / transform.k; });
            }
            //zoom to listings
            if (self.view.listingCircles) {
                self.view.listingCircles
                    .attr('transform', transform + '')
                    .attr('r', function (d) { return self.view.sizeScale(Attribute.count.accessor(d)) / transform.k; });
            }
        });
        //reset zoom  
        this.view.overlay.select('.reset-zoom').on('click', function () {
            var transition$$1 = d3.transition(null).duration(500);
            var markupAxis = d3.axisLeft(self.view.markupScale);
            var otherAxis = d3.axisBottom(self.view.otherScale);
            self.view.svg.select('g.other-axis').transition(transition$$1).call(otherAxis);
            self.view.svg.select('g.markup-axis').transition(transition$$1).call(markupAxis);
            if (self.view.neighborhoodCircles) {
                self.view.neighborhoodCircles
                    .transition(transition$$1)
                    .attr("transform", "translate(0,0)scale(1)");
            }
            if (self.view.listingCircles) {
                self.view.listingCircles
                    .transition(transition$$1)
                    .attr("transform", "translate(0,0) scale(1)");
            }
            self.view.circlesContainerRoot
                .transition(transition$$1)
                .call(zoom$$1.transform, d3.zoomIdentity);
        });
        //call if in drag area
        this.view.circlesContainerRoot.call(zoom$$1);
        this.view.zoom = zoom$$1;
    };
    ScatterPlotComponent.prototype.updateTitle = function () {
        var title = '';
        if (this.selectedLevel === 'Neighborhoods')
            title += 'Neighborhood ';
        else
            title += 'Individual ';
        title += ' Markup vs. ';
        title += this.selectedAttribute.name;
        this.view.title.text(title);
    };
    ScatterPlotComponent.prototype.updateScales = function () {
        var width = this.element.clientWidth;
        var height = this.element.clientHeight;
        var innerPadding = Padding.add(this.view.padding, new Padding(0, 40, 40, 0));
        var markupDomain;
        var sizeDomain;
        var otherDomain;
        // Determine the domains of the scales
        if (this.selectedLevel === 'Neighborhoods') {
            var data = this.filteredNeighborhoods;
            markupDomain = Attribute.markup.neighborhoodDomain(data);
            sizeDomain = Attribute.count.neighborhoodDomain(data);
            otherDomain = this.selectedAttribute.neighborhoodDomain(data);
        }
        else {
            var data = this.filteredListings;
            markupDomain = Attribute.markup.listingDomain(data);
            sizeDomain = Attribute.count.listingDomain(data);
            otherDomain = this.selectedAttribute.listingDomain(data);
        }
        // Update the domains of the scales
        this.view.markupScale = d3.scaleLinear().domain(markupDomain);
        this.view.sizeScale = d3.scaleLinear().domain(sizeDomain);
        if (this.selectedAttribute.kind === 'continuous') {
            this.view.otherScale = d3.scaleLinear().domain(otherDomain);
        }
        else if (this.selectedAttribute.kind === 'ordinal') {
            this.view.otherScale = d3.scalePoint().domain(otherDomain).padding(1);
        }
        // Update the ranges of the scales
        this.view.markupScale.range([innerPadding.height(height) + innerPadding.top, innerPadding.top]);
        this.view.otherScale.range([innerPadding.left, innerPadding.left + innerPadding.width(width)]);
        if (this.selectedLevel === 'Neighborhoods') {
            this.view.sizeScale.range([5, 30]);
        }
        else {
            this.view.sizeScale.range([5, 5]);
        }
    };
    ScatterPlotComponent.prototype.onLoad = function (data) {
        _super.prototype.onLoad.call(this, data);
        this.initializeQuadrants();
        this.initializeAxes();
        this.initializeLevelSelect();
        this.initializeCircles();
        this.initializeDrag();
        this.initializeZoom();
        this.render();
    };
    ScatterPlotComponent.prototype.onSelect = function (selection$$1) {
        var _this = this;
        _super.prototype.onSelect.call(this, selection$$1);
        if (this.selectedLevel === 'Neighborhoods') {
            this.view.neighborhoodCircles.attr('fill', function (d) { return _this.getNeighborhoodCircleFill(d); });
        }
        else {
            this.view.listingCircles.attr('fill', function (d) { return _this.getListingCircleFill(d); });
        }
    };
    ScatterPlotComponent.prototype.onHighlight = function (highlight) {
        var _this = this;
        _super.prototype.onHighlight.call(this, highlight);
        if (this.selectedLevel === 'Neighborhoods') {
            this.view.neighborhoodCircles.attr('fill', function (d) { return _this.getNeighborhoodCircleFill(d); });
        }
        else {
            this.view.listingCircles.attr('fill', function (d) { return _this.getListingCircleFill(d); });
        }
    };
    ScatterPlotComponent.prototype.onFilter = function (filter) {
        _super.prototype.onFilter.call(this, filter);
        this.render();
    };
    ScatterPlotComponent.prototype.resize = function () {
    };
    ScatterPlotComponent.prototype.getNeighborhoodCircleFill = function (neighborhood) {
        var selectedNeighborhoods = this.selection.neighborhoods || [];
        var highlightedNeighborhood = this.highlight.neighborhood;
        if (selectedNeighborhoods.indexOf(neighborhood) !== -1) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        else {
            if (neighborhood === highlightedNeighborhood)
                return 'rgba(255, 100, 100, 0.5)';
            else
                return 'rgba(56, 111, 164, 0.5)';
        }
    };
    ScatterPlotComponent.prototype.getListingCircleFill = function (listing) {
        var selectedListings = this.allSelectedListings;
        var highlightedListing = this.highlight.listing;
        if (selectedListings.indexOf(listing) !== -1) {
            return 'rgba(255, 100, 100, 0.5)';
        }
        else {
            if (this.highlight.listing === listing || this.highlight.neighborhood === listing.neighborhood)
                return 'rgba(255, 100, 100, 0.5)';
            else
                return 'rgba(56, 111, 164, 0.5)';
        }
    };
    ScatterPlotComponent.prototype.drawQuadrants = function (width, height, transition$$1) {
        if (transition$$1 === void 0) { transition$$1 = d3.transition(null); }
        // TODO: determine how these quadrants will be placed
        var quadrantSplitX = width / 2;
        var quadrantSplitY = height / 2;
        var padding = 5;
        this.view.quadrantLineHorizontal
            .attr('x1', 0)
            .attr('x2', width)
            .transition(transition$$1)
            .attr('y1', quadrantSplitY)
            .attr('y2', quadrantSplitY);
        this.view.quadrantLineVertical
            .attr('y1', 0)
            .attr('y2', height)
            .transition(transition$$1)
            .attr('x1', quadrantSplitX)
            .attr('x2', quadrantSplitX);
        this.view.quadrantLabels
            .attr('x', function (d, i) {
            // Indices 0 and 2 are on the left quadrants
            // Indices 1 and 3 are on the right quadrants
            return padding + ((i === 0 || i === 2) ? 0 : quadrantSplitX);
        })
            .attr('y', function (d, i) {
            // Indices 0 and 1 are on the top quadrants
            // Indices 2 and 3 are on the bottom quadrants
            return padding + ((i === 0 || i === 1) ? 0 : quadrantSplitY);
        });
    };
    ScatterPlotComponent.prototype.drawNeighborhoods = function (transition$$1) {
        var _this = this;
        if (transition$$1 === void 0) { transition$$1 = d3.transition(null); }
        var neighborhoodsTransitionActions = function () {
            var circleSelection = _this.view.circlesContainerInner
                .selectAll('circle.neighborhood')
                .data(_this.filteredNeighborhoods, function (n) { return n.name; });
            var circleEnter = circleSelection.enter()
                .append('circle')
                .attr('class', 'neighborhood')
                .attr('opacity', 0)
                .attr('cx', function (d) { return _this.view.otherScale(_this.selectedAttribute.neighborhoodAccessor(d) || 0); })
                .attr('cy', function (d) { return _this.view.markupScale(Attribute.markup.neighborhoodAccessor(d)); })
                .attr('r', function (d) { return _this.view.sizeScale(Attribute.count.neighborhoodAccessor(d)); })
                .on('mouseenter', function (d) { return _this.dispatchNeighborhoodHighlight(d, true); })
                .on('mouseleave', function (d) { return _this.dispatchNeighborhoodHighlight(d, false); })
                .on('click', function (d) { return _this.dispatchNeighborhoodSelection(d, !d3.event.shiftKey); });
            circleSelection.exit()
                .transition().duration(250)
                .attr('opacity', 0)
                .remove();
            _this.view.neighborhoodCircles = circleSelection.merge(circleEnter);
            _this.view.neighborhoodCircles
                .transition().duration(1000)
                .attr('cx', function (d) { return _this.view.otherScale(_this.selectedAttribute.neighborhoodAccessor(d) || 0); })
                .attr('cy', function (d) { return _this.view.markupScale(Attribute.markup.neighborhoodAccessor(d)); })
                .attr('r', function (d) { return _this.view.sizeScale(Attribute.count.neighborhoodAccessor(d)); })
                .attr('fill', function (d) { return _this.getNeighborhoodCircleFill(d); })
                .attr('opacity', function (d) {
                if (_this.selectedAttribute.kind === 'continuous' && isNaN(_this.selectedAttribute.neighborhoodAccessor(d)))
                    return 0;
                else
                    return 1;
            });
            
        };
        // If a zoom transform exists:
        var transform = d3.zoomTransform(this.view.circlesContainerRoot.node());
        if (!(transform.x === 0 && transform.y === 0 && transform.k === 1)) {
            // Reset the zoom transform
            this.view.circlesContainerRoot
                .transition(transition$$1)
                .call(this.view.zoom.transform, d3.zoomIdentity);
            // Transition the elements after the transform transition
            transition$$1 = transition$$1.transition();
        }
        if (this.view.neighborhoodCircles && this.view.listingCircles) {
            this.view.listingCircles
                .style('pointer-events', 'none')
                .transition(transition$$1)
                .attr('cx', function (d) { return _this.view.otherScale(_this.selectedAttribute.neighborhoodAccessor(d.neighborhood) || 0); })
                .attr('cy', function (d) { return _this.view.markupScale(Attribute.markup.neighborhoodAccessor(d.neighborhood)); })
                .transition()
                .attr('r', function (d) { return _this.view.sizeScale(Attribute.count.neighborhoodAccessor(d.neighborhood)); })
                .attr('opacity', 0);
            this.view.neighborhoodCircles
                .style('pointer-events', 'auto')
                .transition(transition$$1)
                .attr('cx', function (d) { return _this.view.otherScale(_this.selectedAttribute.neighborhoodAccessor(d) || 0); })
                .attr('cy', function (d) { return _this.view.markupScale(Attribute.markup.neighborhoodAccessor(d)); })
                .attr('r', function (d) { return _this.view.sizeScale(Attribute.count.neighborhoodAccessor(d)); })
                .transition().duration(1000)
                .attr('opacity', function (d) {
                if (_this.selectedAttribute.kind === 'continuous' && isNaN(_this.selectedAttribute.neighborhoodAccessor(d)))
                    return 0;
                else
                    return 1;
            });
            transition$$1.on('end', neighborhoodsTransitionActions);
        }
        else if (this.view.listingCircles) {
            this.view.listingCircles
                .style('pointer-events', 'none')
                .transition(transition$$1)
                .attr('opacity', 0);
            transition$$1.on('end', neighborhoodsTransitionActions);
        }
        else {
            neighborhoodsTransitionActions();
        }
    };
    ScatterPlotComponent.prototype.drawListings = function (transition$$1) {
        var _this = this;
        if (transition$$1 === void 0) { transition$$1 = d3.transition(null); }
        var listingsTransitionActions = function () {
            var circleSelection = _this.view.circlesContainerInner
                .selectAll('circle.listing')
                .data(_this.filteredListings, function (l) { return l.id + ''; });
            var circleEnter = circleSelection.enter()
                .append('circle')
                .attr('class', 'listing')
                .attr('opacity', 0)
                .attr('cx', function (d) { return _this.view.otherScale(_this.selectedAttribute.accessor(d) || 0); })
                .attr('cy', function (d) { return _this.view.markupScale(Attribute.markup.accessor(d)); })
                .attr('r', function (d) { return _this.view.sizeScale(Attribute.price.accessor(d)); })
                .on('mouseenter', function (d) { return _this.dispatchListingHighlight(d, true); })
                .on('mouseleave', function (d) { return _this.dispatchListingHighlight(d, false); })
                .on('click', function (d) { return _this.dispatchListingSelection(d, !d3.event.shiftKey); });
            circleSelection.exit()
                .transition().duration(250)
                .attr('opacity', 0)
                .remove();
            _this.view.listingCircles = circleSelection.merge(circleEnter);
            _this.view.listingCircles
                .transition().duration(1000)
                .attr('cx', function (d) { return _this.view.otherScale(_this.selectedAttribute.accessor(d) || 0); })
                .attr('cy', function (d) { return _this.view.markupScale(Attribute.markup.accessor(d)); })
                .attr('r', function (d) { return _this.view.sizeScale(Attribute.price.accessor(d)); })
                .attr('fill', function (d) { return _this.getListingCircleFill(d); })
                .attr('opacity', function (d) {
                if (_this.selectedAttribute.kind === 'continuous' && isNaN(_this.selectedAttribute.accessor(d)))
                    return 0;
                else
                    return 1;
            });
        };
        // If a zoom transform exists:
        var transform = d3.zoomTransform(this.view.circlesContainerRoot.node());
        if (!(transform.x === 0 && transform.y === 0 && transform.k === 1)) {
            // Reset the zoom transform
            this.view.circlesContainerRoot
                .transition(transition$$1)
                .call(this.view.zoom.transform, d3.zoomIdentity);
            // Transition the elements after the transform transition
            transition$$1 = transition$$1.transition();
        }
        if (this.view.listingCircles && this.view.neighborhoodCircles) {
            transition$$1.duration(500);
            this.view.listingCircles
                .style('pointer-events', 'auto')
                .transition(transition$$1)
                .attr('opacity', function (d) {
                if (_this.selectedAttribute.kind === 'continuous' && isNaN(_this.selectedAttribute.accessor(d)))
                    return 0;
                else
                    return 1;
            });
            this.view.neighborhoodCircles
                .style('pointer-events', 'none')
                .transition(transition$$1)
                .attr('opacity', 0);
            transition$$1.on('end', listingsTransitionActions);
        }
        else if (this.view.neighborhoodCircles) {
            this.view.neighborhoodCircles
                .style('pointer-events', 'none')
                .transition(transition$$1)
                .attr('opacity', 0);
            transition$$1.on('end', listingsTransitionActions);
        }
        else {
            listingsTransitionActions();
        }
    };
    ScatterPlotComponent.prototype.render = function () {
        var self = this;
        var width = this.element.clientWidth;
        var height = this.element.clientHeight;
        // Create the padding for the scatter plot itself
        var innerPadding = Padding.add(this.view.padding, new Padding(0, 40, 40, 0));
        this.updateTitle();
        this.updateScales();
        var updateTransition = d3.transition(null).duration(1000);
        var markupAxis = d3.axisLeft(this.view.markupScale);
        var otherAxis = d3.axisBottom(this.view.otherScale);
        // Draw the axes
        this.view.svg.select('g.markup-axis')
            .style('transform', innerPadding.translateX(0))
            .transition(updateTransition)
            .call(markupAxis);
        this.view.svg.select('g.other-axis')
            .style('transform', innerPadding.translateY(innerPadding.height(height)))
            .transition(updateTransition)
            .call(otherAxis);
        // Draw axis labels
        this.view.svg.select('g.markup-axis-label')
            .style('transform', "translate(" + this.view.padding.left + "px, " + innerPadding.centerY(height) + "px)");
        // Draw the quadrant lines and labels
        this.view.svg.select('g.quadrant-area').style('transform', innerPadding.translate(0, 0));
        // this.drawQuadrants(innerPadding.width(width), innerPadding.height(height), updateTransition);
        this.view.overlay
            .select('div.other-axis-label')
            .style('left', innerPadding.centerX(width) + "px")
            .style('top', (height - this.view.padding.bottom) + "px")
            .style('transform', 'translateX(-50%)');
        // Update the circles container 
        this.view.circlesContainerGroup.style('transform', innerPadding.translate(0, 0));
        this.view.circlesContainerRoot
            .attr('width', innerPadding.width(width))
            .attr('height', innerPadding.height(height));
        this.view.circlesContainerRoot
            .attr('data-offset-x', innerPadding.left)
            .attr('data-offset-y', innerPadding.top)
            .select('rect.backfill')
            .attr('width', innerPadding.width(width))
            .attr('height', innerPadding.height(height))
            .style('fill', 'transparent');
        this.view.circlesContainerInner
            .attr('transform', "translate(-" + innerPadding.left + " -" + innerPadding.top + ")");
        // Draw the items
        if (this.selectedLevel === 'Neighborhoods') {
            this.drawNeighborhoods(updateTransition);
        }
        else if (this.selectedLevel === 'Listings') {
            this.drawListings(updateTransition);
        }
    };
    return ScatterPlotComponent;
}(BaseComponent));

var DetailComponent = (function (_super) {
    __extends(DetailComponent, _super);
    function DetailComponent(selector, dispatcher) {
        _super.call(this, selector, dispatcher);
        this.airbnbUrl = 'https://www.airbnb.com/rooms/';
        this.view = {};
        this.view.moneyFormat = d3.format('$.2f');
        this.view.listingCountDetail = d3.select(this.element).select('#detail-listing-count .detail-value');
        this.view.medianPriceDetail = d3.select(this.element).select('#detail-median-price .detail-value');
        this.view.medianTruliaPrice = d3.select(this.element).select('#detail-median-trulia-price .detail-value');
        this.view.listingLinkDetail = d3.select(this.element).select('#detail-listing-link');
        this.view.amenitiesColorScale = d3.scaleLinear().range(['#edf8fb', '#386fa4']);
        this.view.amenitiesSVG = d3.select(this.element)
            .select('#detail-amenities .detail-value')
            .append('svg')
            .attr('class', 'amenities-grid')
            .attr('width', 150)
            .attr('height', 160);
        this.view.amenitiesHoverDetails = d3.select(this.element).select('#detail-amenities .detail-name .detail-name-subinfo');
    }
    DetailComponent.prototype.onLoad = function (data) {
        _super.prototype.onLoad.call(this, data);
        // Create the amenities map from the data set
        this.amenitiesMap = new Map(this.data.amenities.map(function (amenity) { return [amenity, 0]; }));
        // Render the default details 
        this.renderAllDetails();
    };
    DetailComponent.prototype.onSelect = function (selection$$1) {
        _super.prototype.onSelect.call(this, selection$$1);
        this.render();
    };
    DetailComponent.prototype.onHighlight = function (highlight) {
        _super.prototype.onHighlight.call(this, highlight);
        this.render();
    };
    DetailComponent.prototype.onFilter = function (filter) {
        _super.prototype.onFilter.call(this, filter);
        this.render();
    };
    DetailComponent.prototype.renderAllDetails = function () {
        // Render details for all our listings
        this.renderListingDetails(this.filteredListings);
    };
    DetailComponent.prototype.renderListingDetails = function (listings) {
        // The number of listings is the count of all combined listings
        this.view.listingCountDetail.text(listings.length);
        // The median price of all listings
        this.view.medianPriceDetail.text(this.view.moneyFormat(d3.median(listings, function (l) { return Attribute.price.accessor(l); })));
        // The truia price
        var listingTruliaPrice = listings.filter(function (l) { return !isNaN(l.prices.trulia.rent_per_bedroom); });
        if (listingTruliaPrice.length > 0) {
            this.view.medianTruliaPrice.text(this.view.moneyFormat(d3.median(listingTruliaPrice, function (l) { return Attribute.truliaPrice.accessor(l); })));
        }
        else {
            this.view.medianTruliaPrice.text('N/A');
        }
        // The link to the listing if there is only one selected
        if (listings.length === 1) {
            this.view.listingLinkDetail
                .style('display', 'block')
                .select('a.detail-value')
                .attr('href', this.airbnbUrl + listings[0].id);
        }
        else {
            this.view.listingLinkDetail
                .style('display', 'none')
                .select('a.detail-value')
                .attr('href', '');
        }
        // Render the amenities grid
        this.renderAmenities(listings);
    };
    DetailComponent.prototype.renderAmenities = function (listings) {
        var _this = this;
        var self = this;
        // Reset the amenities map
        for (var _i = 0, _a = Array.from(this.amenitiesMap.keys()); _i < _a.length; _i++) {
            var amenity = _a[_i];
            this.amenitiesMap.set(amenity, 0);
        }
        // Count the frequency of amenities for these listings
        for (var _b = 0, listings_1 = listings; _b < listings_1.length; _b++) {
            var listing = listings_1[_b];
            for (var _c = 0, _d = listing.amenities; _c < _d.length; _c++) {
                var amenity = _d[_c];
                // If we are tracking this amenity, update it
                if (this.amenitiesMap.has(amenity))
                    this.amenitiesMap.set(amenity, this.amenitiesMap.get(amenity) + 1);
            }
        }
        // Update the amenity color scale
        this.view.amenitiesColorScale.domain(d3.extent(Array.from(this.amenitiesMap.values())));
        // The grid will be a 5-column grid, spanning approximately 150 pixels in width
        var gridBoxSideLength = 20;
        var gridSpacing = 3;
        var gridBoxesPerRow = 5;
        var columnIndex = function (i) { return i % gridBoxesPerRow; };
        var rowIndex = function (i) { return Math.floor(i / gridBoxesPerRow); };
        // Select the grid of amenities
        var amenitiesSelection = this.view.amenitiesSVG
            .selectAll('rect.amenity')
            .data(Array.from(this.amenitiesMap.entries()), function (entry) { return entry[0]; });
        // Draw the grid of amenities for the first time
        var amenitiesEnter = amenitiesSelection
            .enter()
            .append('rect')
            .attr('class', 'amenity')
            .attr('x', function (d, i) { return columnIndex(i) * (gridBoxSideLength + gridSpacing); })
            .attr('y', function (d, i) { return rowIndex(i) * (gridBoxSideLength + gridSpacing); })
            .attr('width', gridBoxSideLength)
            .attr('height', gridBoxSideLength)
            .style('stroke-width', 0)
            .style('stroke', 'black')
            .style('fill', 'white')
            .on('mouseenter', function (_a) {
            var amenity = _a[0], count = _a[1];
            // Don't interact with this amenity if it's filtered out
            if (!self.isAmenityEnabled(amenity))
                return;
            var sel = d3.select(this);
            var listingCount = +sel.attr('data-listings-count');
            var listingPercentage = (count / listingCount * 100).toFixed(0);
            // Highlight this grid square
            d3.select(this).style('stroke-width', self.getAmenityStrokeWidth(amenity, true));
            // Show the details of this amenity
            self.view.amenitiesHoverDetails.html("\n                    " + amenity + "\n                    <br>\n                    " + count + " listings (" + listingPercentage + "%)\n                ");
        })
            .on('mouseleave', function (_a) {
            var amenity = _a[0], count = _a[1];
            // Don't interact with this amenity if it's filtered out
            if (!self.isAmenityEnabled(amenity))
                return;
            // Unhighlight this grid square
            d3.select(this).style('stroke-width', self.getAmenityStrokeWidth(amenity, false));
            // Clear the amenity details
            self.view.amenitiesHoverDetails.html('');
        })
            .on('click', function (_a) {
            var amenity = _a[0], count = _a[1];
            // Don't interact with this amenity if it's filtered out
            if (!self.isAmenityEnabled(amenity))
                return;
            // Send a selection event for this amenity
            self.dispatchAmenitySelection(amenity, !d3.event.shiftKey);
        });
        // Update the amenities grid
        this.view.amenitiesGrid = amenitiesSelection.merge(amenitiesEnter);
        this.view.amenitiesGrid
            .attr('data-listings-count', listings.length)
            .style('fill', function (d) { return _this.getAmenityFill(d); });
    };
    DetailComponent.prototype.isAmenityEnabled = function (amenity) {
        return !(this.filter.amenities.length && this.filter.amenities.indexOf(amenity) === -1);
    };
    DetailComponent.prototype.getAmenityFill = function (_a) {
        var amenity = _a[0], count = _a[1];
        if (this.filter.amenities.length && this.filter.amenities.indexOf(amenity) === -1)
            return 'grey';
        else
            return this.view.amenitiesColorScale(count);
    };
    DetailComponent.prototype.getAmenityStrokeWidth = function (amenity, hover) {
        if (hover === void 0) { hover = false; }
        if (this.selection.amenities.indexOf(amenity) !== -1) {
            return 1;
        }
        else {
            if (hover) {
                return 1;
            }
            else {
                return 0;
            }
        }
    };
    DetailComponent.prototype.resize = function () {
    };
    DetailComponent.prototype.render = function () {
        var _this = this;
        var self = this;
        // Keep track of all the listings that are selected
        if (Dispatch.isEmptySelection(this.selection)) {
            // If something is highlighted, then render those
            if (this.highlight.neighborhood) {
                this.renderListingDetails(this.highlight.neighborhood.listings);
            }
            else if (this.highlight.listing) {
                this.renderListingDetails([this.highlight.listing]);
            }
            else {
                // Nothing was selected, so render the default details
                this.renderAllDetails();
            }
        }
        else {
            // Render all selected listings
            this.renderListingDetails(this.allSelectedListings);
        }
        // Re-color amenities
        this.view.amenitiesGrid.style('fill', function (d) { return _this.getAmenityFill(d); });
        // Highlight the selected amenities, if any
        this.view.amenitiesGrid.style('stroke-width', function (_a) {
            var amenity = _a[0], count = _a[1];
            return _this.getAmenityStrokeWidth(amenity);
        });
    };
    return DetailComponent;
}(BaseComponent));

var SelectionComponent = (function (_super) {
    __extends(SelectionComponent, _super);
    function SelectionComponent(selector, dispatcher) {
        var _this = this;
        _super.call(this, selector, dispatcher);
        var self = this;
        this.view = {};
        this.view.links = d3.select(this.element.parentElement).select('.selection-links');
        this.view.links
            .select('a.reset')
            .on('click', function () {
            _this.dispatcher.call(DispatchEvent.Select, _this, Dispatch.emptySelection());
        });
        this.view.links
            .select('a.apply-filter')
            .on('click', function () {
            var disabled = d3.select(this).classed('disabled');
            if (!disabled) {
                self.dispatcher.call(DispatchEvent.Filter, self, Dispatch.filterFromSelection(self.selection));
                self.dispatcher.call(DispatchEvent.Select, self, Dispatch.emptySelection());
            }
        });
    }
    SelectionComponent.prototype.enforceHeight = function () {
        // Enforce the maximum height of the selection
        var height = this.element.clientHeight;
        d3.select(this.element)
            .select('.selection-container')
            .style('max-height', (height - 10) + "px");
    };
    SelectionComponent.prototype.onSelect = function (selection$$1) {
        _super.prototype.onSelect.call(this, selection$$1);
        this.render();
    };
    SelectionComponent.prototype.resize = function () {
    };
    SelectionComponent.prototype.renderNeighborhoods = function () {
        var self = this;
        var selectionSelection = d3.select(this.selector)
            .select('.selection-neighborhoods')
            .selectAll('div')
            .data(this.selection.neighborhoods || [], function (d) { return d.name; });
        var selectionEnter = selectionSelection
            .enter()
            .append('div')
            .text(function (d) { return d.name; })
            .on('click', function (d) {
            // Send out a deselection event for this neighborhood
            self.dispatchNeighborhoodSelection(d, false);
        });
        var selectionExit = selectionSelection.exit().remove();
        this.view.neighborhoodSelectionList = selectionSelection.merge(selectionEnter);
    };
    SelectionComponent.prototype.renderListings = function () {
        var self = this;
        var selectionSelection = d3.select(this.selector)
            .select('.selection-listings')
            .selectAll('div')
            .data(this.selection.listings || [], function (d) { return d.id + ''; });
        var selectionEnter = selectionSelection
            .enter()
            .append('div')
            .text(function (d) { return d.name; })
            .on('click', function (d) {
            // Send out a deselection event for this listing
            self.dispatchListingSelection(d, false);
        });
        var selectionExit = selectionSelection.exit().remove();
        this.view.listingsSelectionList = selectionSelection.merge(selectionEnter);
    };
    SelectionComponent.prototype.renderPriceBlocks = function () {
        var self = this;
        var selectionSelection = d3.select(this.selector)
            .select('.selection-price-blocks')
            .selectAll('div')
            .data(this.selection.priceBlocks || [], function (d) { return d.number + ''; });
        var selectionEnter = selectionSelection
            .enter()
            .append('div')
            .text(function (d) {
            var label = '$' + d.minimum.toFixed(0);
            if (isNaN(d.maximum)) {
                label += '+';
            }
            else {
                label += ' - $' + d.maximum.toFixed(0);
            }
            return label;
        })
            .on('click', function (d) {
            // Send out a deselection event for this price block
            self.dispatchBlockSelection(d, false);
        });
        var selectionExit = selectionSelection.exit().remove();
        this.view.priceBlocksSelectionList = selectionSelection.merge(selectionEnter);
    };
    SelectionComponent.prototype.renderMarkupBlocks = function () {
        var self = this;
        var selectionSelection = d3.select(this.selector)
            .select('.selection-markup-blocks')
            .selectAll('div')
            .data(this.selection.markupBlocks || [], function (d) { return d.number + ''; });
        var selectionEnter = selectionSelection
            .enter()
            .append('div')
            .text(function (d) {
            var label = d.minimum.toFixed(0);
            if (isNaN(d.maximum)) {
                label += '+%';
            }
            else {
                label += '% - ' + d.maximum.toFixed(0) + '%';
            }
            return label;
        })
            .on('click', function (d) {
            // Send out a deselection event for this markup block
            self.dispatchBlockSelection(d, false);
        });
        var selectionExit = selectionSelection.exit().remove();
        this.view.markupBlocksSelectionList = selectionSelection.merge(selectionEnter);
    };
    SelectionComponent.prototype.renderAmenities = function () {
        var self = this;
        var selectionSelection = d3.select(this.selector)
            .select('.selection-amenities')
            .selectAll('div')
            .data(this.selection.amenities || [], function (amenity) { return amenity; });
        var selectionEnter = selectionSelection
            .enter()
            .append('div')
            .text(function (d) { return d; })
            .on('click', function (d) {
            // Send out a deselection event for this amenity
            self.dispatchAmenitySelection(d, false);
        });
        var selectionExit = selectionSelection.exit().remove();
        this.view.amenitiesSelectionList = selectionSelection.merge(selectionEnter);
    };
    SelectionComponent.prototype.renderSelectionLinks = function () {
        // let pluralize = (count: number, word: string) => {
        //     let label = count + ' ';
        //     if (count === 1) {
        //         label += word;
        //     }
        //     else {
        //         if (word.charAt(word.length - 1) == 'y') {
        //             label += word.slice(0, word.length - 1) + 'ies';
        //         }
        //         else {
        //             label += word + 's';
        //         }
        //     }
        //     return label;
        // };
        if (Dispatch.isEmptySelection(this.selection)) {
            this.view.links.style('display', 'none');
        }
        else {
            if (Dispatch.isOnlyListingSelection(this.selection)) {
                this.view.links.select('.apply-filter').attr('class', 'apply-filter disabled');
            }
            else {
                this.view.links.select('.apply-filter').attr('class', 'apply-filter');
            }
            this.view.links.style('display', 'inline-block');
        }
    };
    SelectionComponent.prototype.render = function () {
        var self = this;
        this.enforceHeight();
        this.renderNeighborhoods();
        this.renderListings();
        this.renderPriceBlocks();
        this.renderMarkupBlocks();
        this.renderAmenities();
        this.renderSelectionLinks();
    };
    return SelectionComponent;
}(BaseComponent));

function CheckboxMultiselect(originalElement, text) {
    var originalSelect = d3.select(originalElement), displaySelect;
    var displayElement = document.createElement('select');
    var displayOption = document.createElement('option');
    var originalOptions = originalSelect.selectAll('option.choice');
    // First hide the select element
    originalSelect
        .style('visibility', 'hidden')
        .style('position', 'absolute');
    // Insert the display <select> element right after it 
    originalElement.parentElement.insertAdjacentElement('beforeend', displayElement);
    displaySelect = d3.select(displayElement);
    // Create a single option
    displayOption.text = text;
    displayElement.add(displayOption);
    // Create the checkbox display
    var checkboxHasFocus = false;
    var checkboxesContainer = document.createElement('div');
    originalElement.parentElement.insertAdjacentElement('beforeend', checkboxesContainer);
    var checkboxesContainerSelect = d3.select(checkboxesContainer)
        .attr('class', 'checkbox-multiselect')
        .style('min-width', displayElement.clientWidth + 'px')
        .on('mousedown', function () {
        checkboxHasFocus = true;
    });
    var checkboxes = checkboxesContainerSelect
        .selectAll('input')
        .data(originalOptions.nodes());
    var checkboxesEnter = checkboxes.enter();
    checkboxesEnter
        .append('label')
        .attr('for', function (d) { return d.text; })
        .text(function (d) { return d.text; })
        .style('display', 'block')
        .on('mousedown', function () {
        checkboxHasFocus = true;
    })
        .append('input')
        .attr('type', 'checkbox')
        .attr('id', function (d) { return d.text; })
        .attr('value', function (d) { return d.text; })
        .style('float', 'left')
        .on('change', function (d) {
        d.selected = this.checked;
        d.parentElement.dispatchEvent(new Event('change'));
    })
        .on('focus', function () {
        checkboxHasFocus = true;
    })
        .on('blur', function () {
        checkboxHasFocus = false;
    });
    // Prevent the display element from showing the default menu
    displayElement.addEventListener('mousedown', function (event) {
        event.preventDefault();
        displayElement.focus();
    });
    displayElement.addEventListener('focus', function (event) {
        if (checkboxesContainerSelect.style('display') === 'none') {
            checkboxesContainerSelect.style('display', 'block');
        }
    });
    displayElement.addEventListener('blur', function (event) {
        var _this = this;
        setTimeout(function () {
            if (checkboxHasFocus) {
                _this.focus();
            }
            else {
                checkboxesContainerSelect.style('display', 'none');
                window.focus();
            }
        }, 33);
    });
    return {
        update: function (text) {
            // Update the displayed text
            displayOption.text = text;
            // Update the checkboxes based on the selected options
            checkboxesContainerSelect
                .selectAll('input')
                .data(originalOptions.nodes())
                .property('checked', function (d) { return d.selected; });
        }
    };
}

var FiltersComponent = (function (_super) {
    __extends(FiltersComponent, _super);
    function FiltersComponent(selector, dispatcher) {
        var _this = this;
        _super.call(this, selector, dispatcher);
        this.view = {};
        this.view.links = d3.select(this.element.parentElement).select('.filter-links');
        this.view.links
            .select('a.reset')
            .on('click', function () {
            _this.dispatcher.call(DispatchEvent.Filter, _this, Dispatch.emptyFilter());
        });
    }
    FiltersComponent.prototype.onLoad = function (data) {
        _super.prototype.onLoad.call(this, data);
        this.render();
    };
    FiltersComponent.prototype.onFilter = function (filter) {
        _super.prototype.onFilter.call(this, filter);
        // Update the filter lists with the chosen filter
        this.view.neighborhoodFilterList.property('selected', function (d) { return filter.neighborhoods.indexOf(d) !== -1; });
        this.view.priceBlocksFilterList.property('selected', function (d) { return filter.priceBlocks.indexOf(d) !== -1; });
        this.view.markupBlocksFilterList.property('selected', function (d) { return filter.markupBlocks.indexOf(d) !== -1; });
        this.view.amenitiesFilterList.property('selected', function (d) { return filter.amenities.indexOf(d) !== -1; });
        // Update the multiselects
        this.view.neighborhoodMultiselect.update(filter.neighborhoods.length + ' neighborhoods');
        this.view.priceBlocksMultiselect.update(filter.priceBlocks.length + ' price blocks');
        this.view.markupBlocksMultiselect.update(filter.markupBlocks.length + ' markup blocks');
        this.view.amenitiesMultiselect.update(filter.amenities.length + ' amenities');
        // Update the reset link
        this.renderFilterLinks();
    };
    FiltersComponent.prototype.resize = function () {
    };
    FiltersComponent.prototype.renderNeighborhoods = function () {
        var _this = this;
        var self = this;
        var filterSelect = d3.select(this.selector).select('.filter-neighborhoods');
        var neighborhoods = Array.from(this.data.neighborhoods.values()).sort(function (a, b) {
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0;
        });
        var filterOptions = filterSelect
            .selectAll('option.choice')
            .data(neighborhoods, function (d) { return d.name; });
        var filterOptionsEnter = filterOptions
            .enter()
            .append('option')
            .attr('class', 'choice')
            .text(function (d) { return d.name; });
        this.view.neighborhoodFilterList = filterOptions.merge(filterOptionsEnter);
        filterSelect.on('change', function () {
            var selectedNeighborhoods = _this.view.neighborhoodFilterList
                .filter(function (d) { return this['selected']; })
                .data();
            _this.dispatcher.call(DispatchEvent.Select, _this, Dispatch.emptySelection());
            _this.dispatchNeighborhoodFilter(selectedNeighborhoods);
        });
    };
    FiltersComponent.prototype.renderPriceBlocks = function () {
        var _this = this;
        var self = this;
        var filterSelect = d3.select(this.selector).select('.filter-price-blocks');
        var filterOptions = filterSelect
            .selectAll('option.choice')
            .data(this.data.priceBlocks, function (d) { return d.number + ''; });
        var filterOptionsEnter = filterOptions
            .enter()
            .append('option')
            .attr('class', 'choice')
            .text(function (d) {
            var label = '$' + d.minimum.toFixed(0);
            if (isNaN(d.maximum)) {
                label += '+';
            }
            else {
                label += ' - $' + d.maximum.toFixed(0);
            }
            return label;
        });
        this.view.priceBlocksFilterList = filterOptions.merge(filterOptionsEnter);
        filterSelect.on('change', function () {
            var selectedPriceBlocks = _this.view.priceBlocksFilterList
                .filter(function (d) { return this['selected']; })
                .data();
            _this.dispatcher.call(DispatchEvent.Select, _this, Dispatch.emptySelection());
            _this.dispatchPriceBlockFilter(selectedPriceBlocks);
        });
    };
    FiltersComponent.prototype.renderMarkupBlocks = function () {
        var _this = this;
        var self = this;
        var filterSelect = d3.select(this.selector).select('.filter-markup-blocks');
        var filterOptions = filterSelect
            .selectAll('option.choice')
            .data(this.data.markupBlocks, function (d) { return d.number + ''; });
        var filterOptionsEnter = filterOptions
            .enter()
            .append('option')
            .attr('class', 'choice')
            .text(function (d) {
            var label = d.minimum.toFixed(0);
            if (isNaN(d.maximum)) {
                label += '+%';
            }
            else {
                label += '% - ' + d.maximum.toFixed(0) + '%';
            }
            return label;
        });
        this.view.markupBlocksFilterList = filterOptions.merge(filterOptionsEnter);
        filterSelect.on('change', function () {
            var selectedMarkupBlocks = _this.view.markupBlocksFilterList
                .filter(function (d) { return this['selected']; })
                .data();
            _this.dispatcher.call(DispatchEvent.Select, _this, Dispatch.emptySelection());
            _this.dispatchMarkupBlockFilter(selectedMarkupBlocks);
        });
    };
    FiltersComponent.prototype.renderAmenities = function () {
        var _this = this;
        var self = this;
        var filterSelect = d3.select(this.selector).select('.filter-amenities');
        var filterOptions = filterSelect
            .selectAll('option.choice')
            .data(this.data.amenities, function (amenity) { return amenity; });
        var filterOptionsEnter = filterOptions
            .enter()
            .append('option')
            .attr('class', 'choice')
            .text(function (d) { return d; });
        this.view.amenitiesFilterList = filterOptions.merge(filterOptionsEnter);
        filterSelect.on('change', function () {
            var selectedAmenities = _this.view.amenitiesFilterList
                .filter(function (d) { return this['selected']; })
                .data();
            _this.dispatcher.call(DispatchEvent.Select, _this, Dispatch.emptySelection());
            _this.dispatchAmenityFilter(selectedAmenities);
        });
    };
    FiltersComponent.prototype.renderFilterLinks = function () {
        if (Dispatch.isEmptyFilter(this.filter)) {
            this.view.links.style('display', 'none');
        }
        else {
            this.view.links.style('display', 'inline-block');
        }
    };
    FiltersComponent.prototype.render = function () {
        var self = this;
        this.renderNeighborhoods();
        this.renderPriceBlocks();
        this.renderMarkupBlocks();
        this.renderAmenities();
        this.renderFilterLinks();
        // Run the checkbox-multiselect plugin on the selects
        this.view.neighborhoodMultiselect = CheckboxMultiselect(this.element.querySelector('.filter-neighborhoods'), '0 neighborhoods');
        this.view.priceBlocksMultiselect = CheckboxMultiselect(this.element.querySelector('.filter-price-blocks'), '0 price blocks');
        this.view.markupBlocksMultiselect = CheckboxMultiselect(this.element.querySelector('.filter-markup-blocks'), '0 markup blocks');
        this.view.amenitiesMultiselect = CheckboxMultiselect(this.element.querySelector('.filter-amenities'), '0 amenities');
    };
    return FiltersComponent;
}(BaseComponent));

var Application = (function () {
    function Application() {
        // Create the dispatcher
        this.dispatcher = d3.dispatch(DispatchEvent.Load, DispatchEvent.Select, DispatchEvent.Highlight, DispatchEvent.Filter);
        // Initialize components
        this.mapComponent = new NeighborhoodMapComponent('#map .content', this.dispatcher);
        this.blocksComponent = new ListingBlocksComponent('#listing-blocks .content', this.dispatcher);
        this.scatterPlotComponent = new ScatterPlotComponent('#scatter-plot .content', this.dispatcher);
        this.detailComponent = new DetailComponent('#details .content', this.dispatcher);
        this.selectionComponent = new SelectionComponent('#selection .content', this.dispatcher);
        this.filtersComponent = new FiltersComponent('#filters .content', this.dispatcher);
        // Begin loading
        this.loadData();
    }
    Application.prototype.initializeBlocks = function (listings) {
        // Initialize the price block ranges
        var priceRanges = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000];
        var markupRanges = [-100, 0, 50, 100, 150, 200, 250, 300, 400, 500];
        var priceBlocks = [];
        var markupBlocks = [];
        for (var i = 0; i < priceRanges.length; i++) {
            priceBlocks.push({
                type: "price",
                number: i,
                minimum: priceRanges[i],
                maximum: (i === priceRanges.length - 1) ? NaN : priceRanges[i + 1],
                listings: []
            });
        }
        for (var i = 0; i < markupRanges.length; i++) {
            markupBlocks.push({
                type: "markup",
                number: i,
                minimum: markupRanges[i],
                maximum: (i === markupRanges.length - 1) ? NaN : markupRanges[i + 1],
                listings: []
            });
        }
        // Initialize the blocks for the listings
        for (var _i = 0, _a = Array.from(listings.values()); _i < _a.length; _i++) {
            var listing = _a[_i];
            var price = listing.prices.airbnb.daily;
            var markup = listing.prices.markup_percentage;
            // Find the right price and markup block for this listing
            for (var _b = 0, priceBlocks_1 = priceBlocks; _b < priceBlocks_1.length; _b++) {
                var block = priceBlocks_1[_b];
                if (Block.contains(block, listing)) {
                    block.listings.push(listing);
                    listing.priceBlock = block;
                    continue;
                }
            }
            for (var _c = 0, markupBlocks_1 = markupBlocks; _c < markupBlocks_1.length; _c++) {
                var block = markupBlocks_1[_c];
                if (Block.contains(block, listing)) {
                    block.listings.push(listing);
                    listing.markupBlock = block;
                    continue;
                }
            }
        }
        // Update the price and markup blocks with information about where they start relative to one another
        priceBlocks.reduce(function (accumulator, block) {
            block.listingsStartIndex = accumulator;
            return accumulator + block.listings.length;
        }, 0);
        markupBlocks.reduce(function (accumulator, block) {
            block.listingsStartIndex = accumulator;
            return accumulator + block.listings.length;
        }, 0);
        // Sort the listings within each block
        for (var _d = 0, priceBlocks_2 = priceBlocks; _d < priceBlocks_2.length; _d++) {
            var block = priceBlocks_2[_d];
            block.listings.sort(function (a, b) { return a.prices.airbnb.daily - b.prices.airbnb.daily; });
        }
        for (var _e = 0, markupBlocks_2 = markupBlocks; _e < markupBlocks_2.length; _e++) {
            var block = markupBlocks_2[_e];
            block.listings.sort(function (a, b) { return a.prices.markup_percentage - b.prices.markup_percentage; });
        }
        return [priceBlocks, markupBlocks];
    };
    Application.prototype.initializeAmenities = function (listings) {
        // Create the amenities map from the data set
        var amenitiesFrequency = new Map();
        for (var _i = 0, _a = Array.from(listings.values()); _i < _a.length; _i++) {
            var listing = _a[_i];
            for (var _b = 0, _c = listing.amenities; _b < _c.length; _b++) {
                var amenity = _c[_b];
                var count = amenitiesFrequency.get(amenity);
                // The amenity wasn't yet seen in this map
                if (count === undefined)
                    amenitiesFrequency.set(amenity, 1);
                else
                    amenitiesFrequency.set(amenity, count + 1);
            }
        }
        // Clean up our list of amenities:
        //   - Get the list of amenities from our calculated map
        //   - Sort the amenities by count of listings that have them
        //   - Filter out the amenities that say 'translation missing' (why do these exist?)
        //   - Take the first of these 35 amenities
        return Array
            .from(amenitiesFrequency.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .filter(function (_a) {
            var amenity = _a[0], count = _a[1];
            return amenity.indexOf('translation missing') === -1;
        })
            .slice(0, 35)
            .map(function (_a) {
            var amenity = _a[0], count = _a[1];
            return amenity;
        });
    };
    Application.prototype.loadData = function () {
        var _this = this;
        var neighborhoods = new Map();
        var listings = new Map();
        // Load the neighborhood JSON and listings JSON
        d3.json('data/neighborhoods.geojson', function (error, geo) {
            d3.csv('data/listings.csv', function (error, data) {
                // Process the listing data
                for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                    var row = data_1[_i];
                    // Get the neighborhood for this listing
                    var neighborhood = neighborhoods.get(row['neighbourhood_cleansed']);
                    // If the neighborhood does not yet exist, create it
                    if (neighborhood === undefined) {
                        neighborhood = {
                            name: row['neighbourhood_cleansed'],
                            listings: []
                        };
                        neighborhoods.set(neighborhood.name, neighborhood);
                    }
                    // Create our current listing and add it to the array and the right neighborhood
                    var listing = Listing.parseCSVRow(row, neighborhood);
                    neighborhood.listings.push(listing);
                    listings.set(listing.id, listing);
                }
                // Process the blocks
                var _a = _this.initializeBlocks(listings), priceBlocks = _a[0], markupBlocks = _a[1];
                // Calculate the most popular amenities
                var amenities = _this.initializeAmenities(listings);
                var loadData = {
                    geo: geo,
                    neighborhoods: neighborhoods,
                    listings: listings,
                    priceBlocks: priceBlocks,
                    markupBlocks: markupBlocks,
                    amenities: amenities
                };
                _this.dispatcher.call(DispatchEvent.Load, undefined, loadData);
            });
        });
    };
    return Application;
}());

function HelpView(element) {
    var viewUrl = element.getAttribute('data-help-view');
    // Ensure that a template view URL exists for this
    if (!viewUrl)
        return;
    // Fetch the template view and store it in a template for later use
    fetch(viewUrl)
        .then(function (response) { return response.text(); })
        .then(function (text) {
        var helpView = document.createElement('div');
        helpView.className = 'help-view';
        helpView.style.display = 'none';
        helpView.innerHTML = '<div class="inner">' + text + '</div>';
        document.body.appendChild(helpView);
        var viewShouldStayVisible = false;
        // Show and hide the help view 
        element.addEventListener('mouseenter', function (event) {
            // First show the view to compute its dimensions
            helpView.style.display = 'block';
            var sourceBox = element.getBoundingClientRect();
            var viewBox = helpView.getBoundingClientRect();
            var horizontal;
            var vertical;
            if (sourceBox.left + viewBox.width < window.innerWidth) {
                horizontal = 'left';
                helpView.style.left = (sourceBox.left + sourceBox.width / 2 - 17) + 'px';
            }
            else {
                horizontal = 'right';
                helpView.style.left = (sourceBox.right - viewBox.width - sourceBox.width / 2 + 17) + 'px';
            }
            if (sourceBox.top + viewBox.height < window.innerHeight) {
                vertical = 'top';
                helpView.style.top = (sourceBox.top + sourceBox.height + 18) + 'px';
            }
            else {
                vertical = 'bottom';
                helpView.style.top = (sourceBox.bottom - sourceBox.height - viewBox.height - 18) + 'px';
            }
            helpView.className = "help-view " + vertical + "-" + horizontal;
        });
        element.addEventListener('mouseleave', function (event) {
            // Hide the view after 500ms, to allow the user to hover over the view
            setTimeout(function () {
                if (!viewShouldStayVisible)
                    helpView.style.display = 'none';
            }, 100);
        });
        helpView.addEventListener('mouseenter', function (event) {
            viewShouldStayVisible = true;
        });
        helpView.addEventListener('mouseleave', function (event) {
            helpView.style.display = 'none';
            viewShouldStayVisible = false;
        });
    });
}

var app = new Application();
// Apply the HelpView to each element
for (var _i = 0, _a = Array.from(document.querySelectorAll('[data-help-view]')); _i < _a.length; _i++) {
    var element = _a[_i];
    HelpView(element);
}

}(d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3,d3));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL3NyYy9kMy50cyIsIi4uL3NyYy9kYXRhL2Rpc3BhdGNoLnRzIiwiLi4vc3JjL2RhdGEvbGlzdGluZy50cyIsIi4uL3NyYy9kYXRhL2Jsb2NrLnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvYmFzZS1jb21wb25lbnQudHMiLCIuLi9zcmMvZGF0YS9hdHRyaWJ1dGUudHMiLCIuLi9zcmMvY29tcG9uZW50cy9uZWlnaGJvcmhvb2QtbWFwLWNvbXBvbmVudC50cyIsIi4uL3NyYy9jb21wb25lbnRzL2xpc3RpbmctYmxvY2tzLWNvbXBvbmVudC50cyIsIi4uL3NyYy9jb21wb25lbnRzL3NjYXR0ZXItcGxvdC1jb21wb25lbnQudHMiLCIuLi9zcmMvY29tcG9uZW50cy9kZXRhaWwtY29tcG9uZW50LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvc2VsZWN0aW9uLWNvbXBvbmVudC50cyIsIi4uL3NyYy91dGlsL2NoZWNrYm94LW11bHRpc2VsZWN0LnRzIiwiLi4vc3JjL2NvbXBvbmVudHMvZmlsdGVycy1jb21wb25lbnQudHMiLCIuLi9zcmMvYXBwbGljYXRpb24udHMiLCIuLi9zcmMvdXRpbC9oZWxwLXZpZXcudHMiLCIuLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0ICogZnJvbSAnZDMtYXJyYXknO1xuZXhwb3J0ICogZnJvbSAnZDMtYXhpcyc7XG5leHBvcnQgKiBmcm9tICdkMy1jb2xsZWN0aW9uJztcbmV4cG9ydCAqIGZyb20gJ2QzLWNvbG9yJztcbmV4cG9ydCAqIGZyb20gJ2QzLWRpc3BhdGNoJztcbmV4cG9ydCAqIGZyb20gJ2QzLWRyYWcnO1xuZXhwb3J0ICogZnJvbSAnZDMtZHN2JztcbmV4cG9ydCAqIGZyb20gJ2QzLWVhc2UnO1xuZXhwb3J0ICogZnJvbSAnZDMtZm9ybWF0JztcbmV4cG9ydCAqIGZyb20gJ2QzLWdlbyc7XG5leHBvcnQgKiBmcm9tICdkMy1pbnRlcnBvbGF0ZSc7XG5leHBvcnQgKiBmcm9tICdkMy1zaGFwZSc7XG5leHBvcnQgKiBmcm9tICdkMy1wYXRoJztcbmV4cG9ydCAqIGZyb20gJ2QzLXF1ZXVlJztcbmV4cG9ydCAqIGZyb20gJ2QzLXJhbmRvbSc7XG5leHBvcnQgKiBmcm9tICdkMy1yZXF1ZXN0JztcbmV4cG9ydCAqIGZyb20gJ2QzLXNjYWxlJztcbmV4cG9ydCAqIGZyb20gJ2QzLXNjYWxlLWNocm9tYXRpYyc7XG5leHBvcnQgKiBmcm9tICdkMy1zZWxlY3Rpb24nO1xuZXhwb3J0ICogZnJvbSAnZDMtdGltZSc7XG5leHBvcnQgKiBmcm9tICdkMy10aW1lcic7XG5leHBvcnQgKiBmcm9tICdkMy10cmFuc2l0aW9uJztcbmV4cG9ydCAqIGZyb20gJ2QzLXpvb20nO1xuXG5pbXBvcnQgKiBhcyBkM1NlbGVjdGlvbiBmcm9tICdkMy1zZWxlY3Rpb24nO1xuaW1wb3J0ICogYXMgZDNBeGlzIGZyb20gJ2QzLWF4aXMnO1xuXG4vKiBcbiAqIEV4dGVuc2lvbiB0byBEMyB0byBmYWNpbGl0YXRlIHJlLW9yZGVyaW5nIGVsZW1lbnRzXG4gKi9cbmQzU2VsZWN0aW9uLnNlbGVjdGlvbi5wcm90b3R5cGUubW92ZVRvRnJvbnQgPSBmdW5jdGlvbigpIHsgIFxuICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGhpcyk7XG4gICAgICB9KTtcbiAgICB9O1xuXG5kM1NlbGVjdGlvbi5zZWxlY3Rpb24ucHJvdG90eXBlLm1vdmVUb0JhY2sgPSBmdW5jdGlvbigpIHsgIFxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7IFxuICAgICAgICB2YXIgZmlyc3RDaGlsZCA9IHRoaXMucGFyZW50Tm9kZS5maXJzdENoaWxkOyBcbiAgICAgICAgaWYgKGZpcnN0Q2hpbGQpIHsgXG4gICAgICAgICAgICB0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHRoaXMsIGZpcnN0Q2hpbGQpOyBcbiAgICAgICAgfSBcbiAgICB9KTtcbn07XG5cbmV4cG9ydCB0eXBlIERhdGFTZWxlY3Rpb248RGF0dW0+ID0gZDNTZWxlY3Rpb24uU2VsZWN0aW9uPGQzU2VsZWN0aW9uLkJhc2VUeXBlLCBEYXR1bSwgZDNTZWxlY3Rpb24uQmFzZVR5cGUsIHt9PjtcbmV4cG9ydCB0eXBlIERhdGFsZXNzU2VsZWN0aW9uID0gRGF0YVNlbGVjdGlvbjx7fT47IFxuXG5leHBvcnQgaW50ZXJmYWNlIEdlbmVyaWNTY2FsZTxEb21haW4sIFJhbmdlPiB7XG4gICAgKHg6IERvbWFpbik6IFJhbmdlO1xuICAgIGRvbWFpbigpOiBBcnJheTxEb21haW4+O1xuICAgIHJhbmdlKCk6IEFycmF5PG51bWJlcj47XG4gICAgY29weSgpOiB0aGlzO1xuICAgIGJhbmR3aWR0aD8oKTogbnVtYmVyO1xuICAgIHRpY2tzPyhjb3VudDogbnVtYmVyIHwgZDNBeGlzLkF4aXNUaW1lSW50ZXJ2YWwpOiBBcnJheTxudW1iZXI+IHwgQXJyYXk8RGF0ZT47XG4gICAgdGlja0Zvcm1hdD8oY291bnQ6IG51bWJlciB8IGQzQXhpcy5BeGlzVGltZUludGVydmFsLCBzcGVjaWZpZXI/OiBzdHJpbmcpOiAoKGQ6IG51bWJlcikgPT4gc3RyaW5nKSB8ICgoZDogRGF0ZSkgPT4gc3RyaW5nKTtcblxuICAgIGRvbWFpbihkb21haW46IEFycmF5PERvbWFpbiB8IHsgdmFsdWVPZigpOiBEb21haW4gfT4pOiB0aGlzO1xuICAgIHJhbmdlKHJhbmdlOiBBcnJheTxSYW5nZT4pOiB0aGlzO1xuICAgIHBhZGRpbmc/KHBhZGRpbmc6IG51bWJlcik6IHRoaXM7XG59XG5cbmV4cG9ydCBjbGFzcyBQYWRkaW5nIHtcbiAgICBwdWJsaWMgdG9wOiBudW1iZXI7XG4gICAgcHVibGljIGJvdHRvbTogbnVtYmVyO1xuICAgIHB1YmxpYyBsZWZ0OiBudW1iZXI7XG4gICAgcHVibGljIHJpZ2h0OiBudW1iZXI7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IoKTtcbiAgICBwdWJsaWMgY29uc3RydWN0b3IoYW1vdW50OiBudW1iZXIpO1xuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcih0b3BsZWZ0OiBudW1iZXIsIGJvdHRvbXJpZ2h0OiBudW1iZXIpO1xuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcih0b3A6IG51bWJlciwgYm90dG9tOiBudW1iZXIsIGxlZnQ6IG51bWJlciwgcmlnaHQ6IG51bWJlcik7XG4gICAgcHVibGljIGNvbnN0cnVjdG9yKGE/OiBudW1iZXIsIGI/OiBudW1iZXIsIGM/OiBudW1iZXIsIGQ/OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKGEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy50b3AgPSB0aGlzLmJvdHRvbSA9IHRoaXMubGVmdCA9IHRoaXMucmlnaHQgPSAwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy50b3AgPSB0aGlzLmJvdHRvbSA9IHRoaXMubGVmdCA9IHRoaXMucmlnaHQgPSBhO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy50b3AgPSB0aGlzLmJvdHRvbSA9IGE7XG4gICAgICAgICAgICB0aGlzLmxlZnQgPSB0aGlzLnJpZ2h0ID0gYjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudG9wID0gYTtcbiAgICAgICAgICAgIHRoaXMuYm90dG9tID0gYjtcbiAgICAgICAgICAgIHRoaXMubGVmdCA9IGM7XG4gICAgICAgICAgICB0aGlzLnJpZ2h0ID0gZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBjZW50ZXJYKHdpZHRoOiBudW1iZXIpIDogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVmdCArIHRoaXMud2lkdGgod2lkdGgpLzI7XG4gICAgfVxuXG4gICAgcHVibGljIGNlbnRlclkoaGVpZ2h0OiBudW1iZXIpIDogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9wICsgdGhpcy5oZWlnaHQoaGVpZ2h0KS8yO1xuICAgIH1cblxuICAgIHB1YmxpYyB3aWR0aCh3aWR0aDogbnVtYmVyKSA6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB3aWR0aCAtIHRoaXMubGVmdCAtIHRoaXMucmlnaHQ7XG4gICAgfVxuXG4gICAgcHVibGljIGhlaWdodChoZWlnaHQ6IG51bWJlcikgOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gaGVpZ2h0IC0gdGhpcy50b3AgLSB0aGlzLmJvdHRvbTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdHJhbnNsYXRlKHg6IG51bWJlciwgeTogbnVtYmVyKSA6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgdHJhbnNsYXRlKCR7dGhpcy5sZWZ0ICsgeH1weCwgJHt0aGlzLnRvcCArIHl9cHgpYDtcbiAgICB9XG5cbiAgICBwdWJsaWMgdHJhbnNsYXRlWCh4OiBudW1iZXIpIDogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGB0cmFuc2xhdGUoJHt0aGlzLmxlZnQgKyB4fXB4LCAwKWA7XG4gICAgfVxuXG4gICAgcHVibGljIHRyYW5zbGF0ZVkoeTogbnVtYmVyKSA6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgdHJhbnNsYXRlKDAsICR7dGhpcy50b3AgKyB5fXB4KWA7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBhZGQoYTogUGFkZGluZywgYjogUGFkZGluZykgOiBQYWRkaW5nIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQYWRkaW5nKGEudG9wICsgYi50b3AsIGEuYm90dG9tICsgYi5ib3R0b20sIGEubGVmdCArIGIubGVmdCwgYS5yaWdodCArIGIucmlnaHQpO1xuICAgIH1cbn0iLCJpbXBvcnQgKiBhcyBkMyBmcm9tICcuLi9kMyc7XG5cbmltcG9ydCB7IE5laWdoYm9yaG9vZEdlb0pTT04gfSBmcm9tICcuL2dlb2pzb24nO1xuaW1wb3J0IHsgTGlzdGluZywgTmVpZ2hib3Job29kIH0gZnJvbSAnLi9saXN0aW5nJztcbmltcG9ydCB7IEJsb2NrIH0gZnJvbSAnLi9ibG9jayc7XG5cbmV4cG9ydCB0eXBlIERpc3BhdGNoID0gZDMuRGlzcGF0Y2g8YW55PjtcbmV4cG9ydCBtb2R1bGUgRGlzcGF0Y2gge1xuICAgIGV4cG9ydCBmdW5jdGlvbiBpc0VtcHR5U2VsZWN0aW9uKHNlbGVjdGlvbjogU2VsZWN0RXZlbnREYXRhKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBzZWxlY3Rpb24ubmVpZ2hib3Job29kcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgIHNlbGVjdGlvbi5saXN0aW5ncy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgIHNlbGVjdGlvbi5wcmljZUJsb2Nrcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgIHNlbGVjdGlvbi5tYXJrdXBCbG9ja3MubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgICBzZWxlY3Rpb24uYW1lbml0aWVzLmxlbmd0aCA9PT0gMFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBpc09ubHlMaXN0aW5nU2VsZWN0aW9uKHNlbGVjdGlvbjogU2VsZWN0RXZlbnREYXRhKSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBzZWxlY3Rpb24ubGlzdGluZ3MubGVuZ3RoICYmXG4gICAgICAgICAgICBzZWxlY3Rpb24ubmVpZ2hib3Job29kcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgIHNlbGVjdGlvbi5wcmljZUJsb2Nrcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgIHNlbGVjdGlvbi5tYXJrdXBCbG9ja3MubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgICBzZWxlY3Rpb24uYW1lbml0aWVzLmxlbmd0aCA9PT0gMFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBlbXB0eVNlbGVjdGlvbigpIDogU2VsZWN0RXZlbnREYXRhIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5laWdoYm9yaG9vZHM6IFtdLFxuICAgICAgICAgICAgbGlzdGluZ3M6IFtdLFxuICAgICAgICAgICAgcHJpY2VCbG9ja3M6IFtdLFxuICAgICAgICAgICAgbWFya3VwQmxvY2tzOiBbXSxcbiAgICAgICAgICAgIGFtZW5pdGllczogW11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gY2xvbmVTZWxlY3Rpb24oc2VsZWN0aW9uOiBTZWxlY3RFdmVudERhdGEpIHtcbiAgICAgICAgbGV0IGNsb25lZDogU2VsZWN0RXZlbnREYXRhID0gRGlzcGF0Y2guZW1wdHlTZWxlY3Rpb24oKTtcblxuICAgICAgICBpZiAoc2VsZWN0aW9uLm5laWdoYm9yaG9vZHMpXG4gICAgICAgICAgICBjbG9uZWQubmVpZ2hib3Job29kcyA9IHNlbGVjdGlvbi5uZWlnaGJvcmhvb2RzLnNsaWNlKCk7XG5cbiAgICAgICAgaWYgKHNlbGVjdGlvbi5saXN0aW5ncylcbiAgICAgICAgICAgIGNsb25lZC5saXN0aW5ncyA9IHNlbGVjdGlvbi5saXN0aW5ncy5zbGljZSgpO1xuXG4gICAgICAgIGlmIChzZWxlY3Rpb24ucHJpY2VCbG9ja3MpXG4gICAgICAgICAgICBjbG9uZWQucHJpY2VCbG9ja3MgPSBzZWxlY3Rpb24ucHJpY2VCbG9ja3Muc2xpY2UoKTtcblxuICAgICAgICBpZiAoc2VsZWN0aW9uLm1hcmt1cEJsb2NrcylcbiAgICAgICAgICAgIGNsb25lZC5tYXJrdXBCbG9ja3MgPSBzZWxlY3Rpb24ubWFya3VwQmxvY2tzLnNsaWNlKCk7XG5cbiAgICAgICAgaWYgKHNlbGVjdGlvbi5hbWVuaXRpZXMpXG4gICAgICAgICAgICBjbG9uZWQuYW1lbml0aWVzID0gc2VsZWN0aW9uLmFtZW5pdGllcy5zbGljZSgpO1xuXG4gICAgICAgIHJldHVybiBjbG9uZWQ7XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGVtcHR5SGlnaGxpZ2h0KCkgOiBIaWdobGlnaHRFdmVudERhdGEge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmVpZ2hib3Job29kOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBsaXN0aW5nOiB1bmRlZmluZWRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gZW1wdHlGaWx0ZXIoKSA6IEZpbHRlckV2ZW50RGF0YSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuZWlnaGJvcmhvb2RzOiBbXSxcbiAgICAgICAgICAgIHByaWNlQmxvY2tzOiBbXSxcbiAgICAgICAgICAgIG1hcmt1cEJsb2NrczogW10sXG4gICAgICAgICAgICBhbWVuaXRpZXM6IFtdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzRW1wdHlGaWx0ZXIoZmlsdGVyOiBGaWx0ZXJFdmVudERhdGEpIDogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBmaWx0ZXIubmVpZ2hib3Job29kcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgIGZpbHRlci5wcmljZUJsb2Nrcy5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgICAgIGZpbHRlci5tYXJrdXBCbG9ja3MubGVuZ3RoID09PSAwICYmXG4gICAgICAgICAgICBmaWx0ZXIuYW1lbml0aWVzLmxlbmd0aCA9PT0gMFxuICAgICAgICApO1xuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBjbG9uZUZpbHRlcihmaWx0ZXI6IEZpbHRlckV2ZW50RGF0YSkgOiBGaWx0ZXJFdmVudERhdGEge1xuICAgICAgICBsZXQgY2xvbmVkOiBGaWx0ZXJFdmVudERhdGEgPSBEaXNwYXRjaC5lbXB0eUZpbHRlcigpO1xuXG4gICAgICAgIGlmIChmaWx0ZXIubmVpZ2hib3Job29kcylcbiAgICAgICAgICAgIGNsb25lZC5uZWlnaGJvcmhvb2RzID0gZmlsdGVyLm5laWdoYm9yaG9vZHMuc2xpY2UoKTtcblxuICAgICAgICBpZiAoZmlsdGVyLnByaWNlQmxvY2tzKVxuICAgICAgICAgICAgY2xvbmVkLnByaWNlQmxvY2tzID0gZmlsdGVyLnByaWNlQmxvY2tzLnNsaWNlKCk7XG5cbiAgICAgICAgaWYgKGZpbHRlci5tYXJrdXBCbG9ja3MpXG4gICAgICAgICAgICBjbG9uZWQubWFya3VwQmxvY2tzID0gZmlsdGVyLm1hcmt1cEJsb2Nrcy5zbGljZSgpO1xuXG4gICAgICAgIGlmIChmaWx0ZXIuYW1lbml0aWVzKSBcbiAgICAgICAgICAgIGNsb25lZC5hbWVuaXRpZXMgPSBmaWx0ZXIuYW1lbml0aWVzLnNsaWNlKCk7XG5cbiAgICAgICAgcmV0dXJuIGNsb25lZDtcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gZmlsdGVyRnJvbVNlbGVjdGlvbihzZWxlY3Rpb246IFNlbGVjdEV2ZW50RGF0YSkgOiBGaWx0ZXJFdmVudERhdGEge1xuICAgICAgICBsZXQgZmlsdGVyOiBGaWx0ZXJFdmVudERhdGEgPSBEaXNwYXRjaC5lbXB0eUZpbHRlcigpO1xuICAgICAgICBmaWx0ZXIubmVpZ2hib3Job29kcyA9IHNlbGVjdGlvbi5uZWlnaGJvcmhvb2RzLnNsaWNlKCk7XG4gICAgICAgIGZpbHRlci5wcmljZUJsb2NrcyA9IHNlbGVjdGlvbi5wcmljZUJsb2Nrcy5zbGljZSgpO1xuICAgICAgICBmaWx0ZXIubWFya3VwQmxvY2tzID0gc2VsZWN0aW9uLm1hcmt1cEJsb2Nrcy5zbGljZSgpO1xuICAgICAgICBmaWx0ZXIuYW1lbml0aWVzID0gc2VsZWN0aW9uLmFtZW5pdGllcy5zbGljZSgpO1xuICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgIH07XG59XG5cblxuZXhwb3J0IGNvbnN0IERpc3BhdGNoRXZlbnQgPSB7XG4gICAgTG9hZDogJ2xvYWQnLFxuICAgIFNlbGVjdDogJ3NlbGVjdCcsXG4gICAgSGlnaGxpZ2h0OiAnaGlnaGxpZ2h0JyxcbiAgICBGaWx0ZXI6ICdmaWx0ZXInXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIExvYWRFdmVudERhdGEge1xuICAgIGdlbzogTmVpZ2hib3Job29kR2VvSlNPTjtcbiAgICBuZWlnaGJvcmhvb2RzOiBNYXA8TmVpZ2hib3Job29kLk5hbWVUeXBlLCBOZWlnaGJvcmhvb2Q+O1xuICAgIGxpc3RpbmdzOiBNYXA8TGlzdGluZy5JRFR5cGUsIExpc3Rpbmc+O1xuICAgIHByaWNlQmxvY2tzOiBCbG9ja1tdO1xuICAgIG1hcmt1cEJsb2NrczogQmxvY2tbXTtcbiAgICBhbWVuaXRpZXM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlbGVjdEV2ZW50RGF0YSB7XG4gICAgbmVpZ2hib3Job29kczogTmVpZ2hib3Job29kW107XG4gICAgbGlzdGluZ3M6IExpc3RpbmdbXTtcbiAgICBwcmljZUJsb2NrczogQmxvY2tbXTtcbiAgICBtYXJrdXBCbG9ja3M6IEJsb2NrW107XG4gICAgYW1lbml0aWVzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIaWdobGlnaHRFdmVudERhdGEge1xuICAgIG5laWdoYm9yaG9vZDogTmVpZ2hib3Job29kO1xuICAgIGxpc3Rpbmc6IExpc3Rpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRmlsdGVyRXZlbnREYXRhIHtcbiAgICBuZWlnaGJvcmhvb2RzOiBOZWlnaGJvcmhvb2RbXTtcbiAgICBwcmljZUJsb2NrczogQmxvY2tbXTtcbiAgICBtYXJrdXBCbG9ja3M6IEJsb2NrW107XG4gICAgYW1lbml0aWVzOiBzdHJpbmdbXTtcbn1cblxuLy8gTG9hZDpcbi8vICAgICAgLSBnZW9qc29uOiBtYXAgZGF0YVxuLy8gICAgICAtIG5laWdoYm9yaG9vZHM6IG1hcHBpbmcgZnJvbSBuZWlnaGJvcmhvb2QgbmFtZSB0byBsaXN0aW5nIGlkc1xuLy8gICAgICAtIGxpc3RpbmdzOiBtYXBwaW5nIGZyb20gbGlzdGluZyBpZHMgdG8gbGlzdGluZ3Ncbi8vICAgICAgLSBwcmljZUJsb2NrczogbGlzdCBvZiBibG9ja3MgdGhhdCBjb250YWluIHRoZSBwcmljZSByYW5nZXNcbi8vICAgICAgLSBtYXJrdXBCbG9ja3M6IGxpc3Qgb2YgYmxvY2tzIHRoYXQgY29udGFpbiB0aGUgbWFya3VwIHJhbmdlc1xuLy8gICAgICAtIGFtZW5pdGllczogbGlzdCBvZiBhbWVuaXRpZXMgdGhhdCBhcmUgdHJhY2tlZFxuXG4vLyBTZWxlY3Q6XG4vLyAgICAgIC0gbmVpZ2hib3Job29kczogYXJyYXkgb2YgbmVpZ2hib3Job29kIFxuLy8gICAgICAtIGxpc3RpbmdzOiBhcnJheSBvZiBsaXN0aW5nIFxuLy8gICAgICAtIHByaWNlQmxvY2tzOiBhcnJheSBvZiBwcmljZSBibG9ja3MgdGhhdCBhcmUgc2VsZWN0ZWRcbi8vICAgICAgLSBtYXJrdXBCbG9ja3M6IGFycmF5IG9mIG1hcmt1cCBibG9ja3MgdGhhdCBhcmUgc2VsZWN0ZWRcbi8vICAgICAgLSBhbWVuaXRpZXM6IGFycmF5IG9mIGFtZW5pdGllcyB0aGF0IGFyZSBzZWxlY3RlZFxuLy9cblxuLy8gSGlnaGxpZ2h0OlxuLy8gICAgICAtIG5laWdoYm9yaG9vZDogbmVpZ2hib3Job29kIG5hbWVcbi8vICAgICAgLSBsaXN0aW5nOiBsaXN0aW5nIGlkXG4vL1xuLy8gKGVpdGhlciBuZWlnaGJvcmhvb2RzLCBvciBsaXN0aW5ncywgb3Igbm9uZSlcblxuLy8gRmlsdGVyOlxuLy8gICAgICAtIG5laWdoYm9yaG9vZHM6IGFycmF5IG9mIG5laWdoYm9yaG9vZFxuLy8gICAgICAtIHByaWNlQmxvY2tzOiBhcnJheSBvZiBwcmljZSBibG9ja3MgdGhhdCBhcmUgc2VsZWN0ZWRcbi8vICAgICAgLSBtYXJrdXBCbG9ja3M6IGFycmF5IG9mIG1hcmt1cCBibG9ja3MgdGhhdCBhcmUgc2VsZWN0ZWRcbi8vICAgICAgLSBhbWVuaXRpZXM6IGFycmF5IG9mIGFtZW5pdGllcyB0aGF0IGFyZSBzZWxlY3RlZCIsImltcG9ydCAqIGFzIGQzIGZyb20gJy4uL2QzJztcbmltcG9ydCB7IEJsb2NrIH0gZnJvbSAnLi9CbG9jayc7XG5cbmV4cG9ydCBtb2R1bGUgTGlzdGluZyB7XG4gICAgLy8gUGFyc2UgdGhlIGFtZW5pdGllcyBpbnRvIGFuIGFycmF5IGZvciB0aGUgZ2l2ZW4gYW1lbml0aWVzIHN0cmluZ1xuICAgIGZ1bmN0aW9uIHBhcnNlQW1lbml0aWVzKGFtZW5pdGllczogc3RyaW5nKTogc3RyaW5nW10ge1xuICAgICAgICByZXR1cm4gYW1lbml0aWVzXG4gICAgICAgICAgICAubWF0Y2goL3soLio/KX0vKVsxXVxuICAgICAgICAgICAgLnNwbGl0KCcsJylcbiAgICAgICAgICAgIC5tYXAobCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGwuY2hhckF0KDApID09PSAnXCInKSBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGwuc3Vic3RyaW5nKDEsIGwubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGw7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBleHBvcnQgdHlwZSBJRFR5cGUgPSBudW1iZXI7XG4gICAgZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ1NWUm93KHJvdzogZDMuRFNWUm93U3RyaW5nLCBuZWlnaGJvcmhvb2Q6IE5laWdoYm9yaG9vZCkgOiBMaXN0aW5nIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlkOiArcm93WydpZCddLFxuICAgICAgICAgICAgbmFtZTogcm93WyduYW1lJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogcm93WydkZXNjcmlwdGlvbiddLFxuICAgICAgICAgICAgbmVpZ2hib3Job29kOiBuZWlnaGJvcmhvb2QsXG4gICAgICAgICAgICBwcmljZUJsb2NrOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBtYXJrdXBCbG9jazogdW5kZWZpbmVkLFxuICAgICAgICAgICAgYW1lbml0aWVzOiBwYXJzZUFtZW5pdGllcyhyb3dbJ2FtZW5pdGllcyddKSxcbiAgICAgICAgICAgIGNhbmNlbGxhdGlvbl9wb2xpY3k6IHJvd1snY2FuY2VsbGF0aW9uX3BvbGljeSddLFxuICAgICAgICAgICAgcmV2aWV3czoge1xuICAgICAgICAgICAgICAgIG51bWJlcl9vZl9yZXZpZXdzOiArcm93WydudW1iZXJfb2ZfcmV2aWV3cyddLFxuICAgICAgICAgICAgICAgIG51bWJlcjogKyhyb3dbJ251bWJlcl9vZl9yZXZpZXdzJ10pLFxuICAgICAgICAgICAgICAgIG51bWJlclBlck1vbnRoOiArKHJvd1sncmV2aWV3c19wZXJfbW9udGgnXSksXG4gICAgICAgICAgICAgICAgcmF0aW5nOiBwYXJzZUludChyb3dbJ3Jldmlld19zY29yZXNfcmF0aW5nJ10pLFxuICAgICAgICAgICAgICAgIHNjb3Jlczoge1xuICAgICAgICAgICAgICAgICAgICBhY2N1cmFjeTogK3Jvd1sncmV2aWV3X3Njb3Jlc19hY2N1cmFjeSddLFxuICAgICAgICAgICAgICAgICAgICBjbGVhbmxpbmVzczogK3Jvd1sncmV2aWV3X3Njb3Jlc19jbGVhbmxpbmVzcyddLFxuICAgICAgICAgICAgICAgICAgICBjaGVja2luOiArcm93WydyZXZpZXdfc2NvcmVzX2NoZWNraW4nXSxcbiAgICAgICAgICAgICAgICAgICAgY29tbXVuaWNhdGlvbjogK3Jvd1sncmV2aWV3X3Njb3Jlc19jb21tdW5pY2F0aW9uJ10sXG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiArcm93WydyZXZpZXdfc2NvcmVzX2xvY2F0aW9uJ10sXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiArcm93WydyZXZpZXdfc2NvcmVzX3ZhbHVlJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ3Vlc3RzX2luY2x1ZGVkOiArcm93WydndWVzdHNfaW5jbHVkZWQnXSxcbiAgICAgICAgICAgIHByaWNlczoge1xuICAgICAgICAgICAgICAgIG1hcmt1cF9hbW91bnQ6ICtyb3dbJ3JlbnRfZGlmZmVyZW5jZSddLFxuICAgICAgICAgICAgICAgIG1hcmt1cF9wZXJjZW50YWdlOiArcm93WydyZW50X2RpZmZlcmVuY2VfcGVyY2VudGFnZV9vZl9tZWRpYW4nXSAqIDEwMCxcbiAgICAgICAgICAgICAgICBhaXJibmI6IHtcbiAgICAgICAgICAgICAgICAgICAgZGFpbHk6ICtyb3dbJ3ByaWNlJ10sXG4gICAgICAgICAgICAgICAgICAgIG1vbnRobHk6ICtyb3dbJ2FpcmJuYl9tb250aGx5X3JlbnQnXSxcbiAgICAgICAgICAgICAgICAgICAgbW9udGhseV9wZXJfYmVkcm9vbTogK3Jvd1snYWlyYm5iX21vbnRobHlfcmVudF9wZXJfYmVkcm9vbSddXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0cnVsaWE6IHtcbiAgICAgICAgICAgICAgICAgICAgcmVudF9wZXJfYmVkcm9vbTogK3Jvd1sndHJ1bGlhX21lZGlhbl9yZW50X3Blcl9iZWRyb29tJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbn1cblxuZXhwb3J0IG1vZHVsZSBOZWlnaGJvcmhvb2Qge1xuICAgIGV4cG9ydCB0eXBlIE5hbWVUeXBlID0gc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExpc3Rpbmcge1xuICAgIGlkOiBMaXN0aW5nLklEVHlwZTtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBuZWlnaGJvcmhvb2Q6IE5laWdoYm9yaG9vZDtcbiAgICBwcmljZUJsb2NrOiBCbG9jaztcbiAgICBtYXJrdXBCbG9jazogQmxvY2s7XG4gICAgYW1lbml0aWVzOiBzdHJpbmdbXTtcbiAgICBjYW5jZWxsYXRpb25fcG9saWN5OiBzdHJpbmc7XG4gICAgZ3Vlc3RzX2luY2x1ZGVkOm51bWJlcjtcbiAgICByZXZpZXdzOiB7XG4gICAgICAgIG51bWJlcl9vZl9yZXZpZXdzOiBudW1iZXI7XG4gICAgICAgIG51bWJlcjogbnVtYmVyO1xuICAgICAgICBudW1iZXJQZXJNb250aDogbnVtYmVyO1xuICAgICAgICByYXRpbmc6IG51bWJlcjtcbiAgICAgICAgc2NvcmVzOiB7XG4gICAgICAgICAgICBhY2N1cmFjeTogbnVtYmVyO1xuICAgICAgICAgICAgY2xlYW5saW5lc3M6IG51bWJlcjtcbiAgICAgICAgICAgIGNoZWNraW46IG51bWJlcjtcbiAgICAgICAgICAgIGNvbW11bmljYXRpb246IG51bWJlcjtcbiAgICAgICAgICAgIGxvY2F0aW9uOiBudW1iZXI7XG4gICAgICAgICAgICB2YWx1ZTogbnVtYmVyO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBwcmljZXM6IHtcbiAgICAgICAgbWFya3VwX2Ftb3VudDogbnVtYmVyO1xuICAgICAgICBtYXJrdXBfcGVyY2VudGFnZTogbnVtYmVyO1xuICAgICAgICBhaXJibmI6IHtcbiAgICAgICAgICAgIGRhaWx5OiBudW1iZXI7XG4gICAgICAgICAgICBtb250aGx5OiBudW1iZXI7XG4gICAgICAgICAgICBtb250aGx5X3Blcl9iZWRyb29tOiBudW1iZXI7XG4gICAgICAgIH07XG4gICAgICAgIHRydWxpYToge1xuICAgICAgICAgICAgcmVudF9wZXJfYmVkcm9vbTogbnVtYmVyO1xuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBOZWlnaGJvcmhvb2Qge1xuICAgIG5hbWU6IE5laWdoYm9yaG9vZC5OYW1lVHlwZTtcbiAgICBsaXN0aW5nczogTGlzdGluZ1tdO1xufSIsImltcG9ydCB7IExpc3RpbmcgfSBmcm9tICcuL2xpc3RpbmcnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEJsb2NrIHtcbiAgICB0eXBlOiBcInByaWNlXCIgfCBcIm1hcmt1cFwiO1xuICAgIG51bWJlcjogbnVtYmVyO1xuICAgIG1pbmltdW06IG51bWJlcjtcbiAgICBtYXhpbXVtOiBudW1iZXI7XG4gICAgbGlzdGluZ3M6IExpc3RpbmdbXTtcbiAgICBsaXN0aW5nc1N0YXJ0SW5kZXg/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBtb2R1bGUgQmxvY2sge1xuICAgIGV4cG9ydCBmdW5jdGlvbiBjb250YWlucyhibG9jazogQmxvY2ssIGxpc3Rpbmc6IExpc3RpbmcpIDogYm9vbGVhbiB7XG4gICAgICAgIGxldCB2YWx1ZSA9IDA7XG4gICAgICAgIFxuICAgICAgICBpZiAoYmxvY2sudHlwZSA9PT0gXCJwcmljZVwiKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGxpc3RpbmcucHJpY2VzLmFpcmJuYi5kYWlseTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gbGlzdGluZy5wcmljZXMubWFya3VwX3BlcmNlbnRhZ2U7XG4gICAgICAgIH0gICAgICAgICAgICBcblxuICAgICAgICByZXR1cm4gYmxvY2subWluaW11bSA8PSB2YWx1ZSAmJiAoaXNOYU4oYmxvY2subWF4aW11bSkgfHwgdmFsdWUgPCBibG9jay5tYXhpbXVtKTtcbiAgICB9XG5cbiAgICBleHBvcnQgZnVuY3Rpb24gdmFsdWUoYmxvY2s6IEJsb2NrLCBsaXN0aW5nOiBMaXN0aW5nKSA6IG51bWJlciB7XG4gICAgICAgIGlmIChibG9jay50eXBlID09PSBcInByaWNlXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBsaXN0aW5nLnByaWNlcy5haXJibmIuZGFpbHk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbGlzdGluZy5wcmljZXMubWFya3VwX3BlcmNlbnRhZ2U7XG4gICAgICAgIH1cbiAgICB9XG59IiwiaW1wb3J0ICogYXMgZDMgZnJvbSAnLi4vZDMnO1xuaW1wb3J0ICogYXMgZGlzcGF0Y2ggZnJvbSAnLi4vZGF0YS9kaXNwYXRjaCc7XG5pbXBvcnQgeyBOZWlnaGJvcmhvb2QsIExpc3RpbmcgfSBmcm9tICcuLi9kYXRhL2xpc3RpbmcnO1xuaW1wb3J0IHsgQmxvY2sgfSBmcm9tICcuLi9kYXRhL2Jsb2NrJztcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VDb21wb25lbnQge1xuICAgIHByb3RlY3RlZCBlbGVtZW50OiBFbGVtZW50O1xuICAgIHByb3RlY3RlZCBzZWxlY3Rvcjogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBkaXNwYXRjaGVyOiBkaXNwYXRjaC5EaXNwYXRjaDtcblxuICAgIHByb3RlY3RlZCBkYXRhOiBkaXNwYXRjaC5Mb2FkRXZlbnREYXRhO1xuICAgIHByb3RlY3RlZCBzZWxlY3Rpb246IGRpc3BhdGNoLlNlbGVjdEV2ZW50RGF0YTtcbiAgICBwcm90ZWN0ZWQgaGlnaGxpZ2h0OiBkaXNwYXRjaC5IaWdobGlnaHRFdmVudERhdGE7XG4gICAgcHJvdGVjdGVkIGZpbHRlcjogZGlzcGF0Y2guRmlsdGVyRXZlbnREYXRhO1xuXG4gICAgcHJvdGVjdGVkIGZpbHRlcmVkTGlzdGluZ3M6IExpc3RpbmdbXTtcbiAgICBwcm90ZWN0ZWQgZmlsdGVyZWRMaXN0aW5nc01hcDogTWFwPExpc3RpbmcuSURUeXBlLCBMaXN0aW5nPjtcbiAgICBwcm90ZWN0ZWQgZmlsdGVyZWROZWlnaGJvcmhvb2RzOiBOZWlnaGJvcmhvb2RbXTtcbiAgICBwcm90ZWN0ZWQgZmlsdGVyZWROZWlnaGJvcmhvb2RNYXA6IE1hcDxOZWlnaGJvcmhvb2QuTmFtZVR5cGUsIE5laWdoYm9yaG9vZD47XG5cbiAgICBwcm90ZWN0ZWQgYWxsU2VsZWN0ZWRMaXN0aW5nczogTGlzdGluZ1tdO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHNlbGVjdG9yOiBzdHJpbmcsIGRpc3BhdGNoZXI6IGRpc3BhdGNoLkRpc3BhdGNoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICB0aGlzLnNlbGVjdG9yID0gc2VsZWN0b3I7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlciA9IGRpc3BhdGNoZXI7XG5cbiAgICAgICAgLy8gU2V0IHVwIGRpc3BhdGNoIGxpc3RlbmVyc1xuICAgICAgICB0aGlzLmRpc3BhdGNoZXIub24odGhpcy5nZXRDb21wb25lbnRFdmVudE5hbWUoZGlzcGF0Y2guRGlzcGF0Y2hFdmVudC5Mb2FkKSwgdGhpcy5ldmVudEJpbmQodGhpcy5vbkxvYWQpKTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaGVyLm9uKHRoaXMuZ2V0Q29tcG9uZW50RXZlbnROYW1lKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuU2VsZWN0KSwgdGhpcy5ldmVudEJpbmQodGhpcy5vblNlbGVjdCkpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoZXIub24odGhpcy5nZXRDb21wb25lbnRFdmVudE5hbWUoZGlzcGF0Y2guRGlzcGF0Y2hFdmVudC5IaWdobGlnaHQpLCB0aGlzLmV2ZW50QmluZCh0aGlzLm9uSGlnaGxpZ2h0KSk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlci5vbih0aGlzLmdldENvbXBvbmVudEV2ZW50TmFtZShkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LkZpbHRlciksIHRoaXMuZXZlbnRCaW5kKHRoaXMub25GaWx0ZXIpKTtcblxuICAgICAgICAvLyBTZXQgdXAgZW1wdHkgZXZlbnRzXG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gZGlzcGF0Y2guRGlzcGF0Y2guZW1wdHlTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5oaWdobGlnaHQgPSB7IG5laWdoYm9yaG9vZDogdW5kZWZpbmVkLCBsaXN0aW5nOiB1bmRlZmluZWQgfTtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBkaXNwYXRjaC5EaXNwYXRjaC5lbXB0eUZpbHRlcigpO1xuXG4gICAgICAgIHRoaXMuYWxsU2VsZWN0ZWRMaXN0aW5ncyA9IFtdO1xuICAgICAgICB0aGlzLmZpbHRlcmVkTGlzdGluZ3MgPSBbXTtcbiAgICAgICAgdGhpcy5maWx0ZXJlZExpc3RpbmdzTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmZpbHRlcmVkTmVpZ2hib3Job29kcyA9IFtdO1xuICAgICAgICB0aGlzLmZpbHRlcmVkTmVpZ2hib3Job29kTWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZXZlbnRCaW5kKGhhbmRsZXI6IEZ1bmN0aW9uKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXJnczogYW55KSB7XG4gICAgICAgICAgICAvLyBJbiB0aGlzIGZ1bmN0aW9uLCAndGhpcycgaXMgdGhlIHNlbmRlciBvZiB0aGUgZGlzcGF0Y2ggY2FsbFxuICAgICAgICAgICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnROYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yWyduYW1lJ107XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRDb21wb25lbnRFdmVudE5hbWUoZXZlbnQ6IHN0cmluZykgOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gZXZlbnQgKyAnLicgKyB0aGlzLmdldENvbXBvbmVudE5hbWUoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbXB1dGVBbGxTZWxlY3RlZExpc3RpbmdzKCkge1xuICAgICAgICB0aGlzLmFsbFNlbGVjdGVkTGlzdGluZ3MgPSBbXTtcblxuICAgICAgICBpZiAoZGlzcGF0Y2guRGlzcGF0Y2guaXNFbXB0eVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbikpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAobGV0IGxpc3Rpbmcgb2YgdGhpcy5maWx0ZXJlZExpc3RpbmdzKSB7XG4gICAgICAgICAgICAvLyBEb24ndCBhZGQgbGlzdGluZ3Mgbm90IGluIGEgc2VsZWN0ZWQgbmVpZ2hib3Job29kXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24ubmVpZ2hib3Job29kcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24ubmVpZ2hib3Job29kcy5pbmRleE9mKGxpc3RpbmcubmVpZ2hib3Job29kKSA9PT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEb24ndCBhZGQgbGlzdGluZ3Mgbm90IGluIHRoZSBzZWxlY3RlZCBsaXN0aW5nc1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uLmxpc3RpbmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbi5saXN0aW5ncy5pbmRleE9mKGxpc3RpbmcpID09PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvbid0IGFkZCBsaXN0aW5ncyBub3QgaW4gYSBzZWxlY3RlZCBwcmljZSBibG9ja1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uLnByaWNlQmxvY2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbi5wcmljZUJsb2Nrcy5pbmRleE9mKGxpc3RpbmcucHJpY2VCbG9jaykgPT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRG9uJ3QgYWRkIGxpc3RpbmdzIG5vdCBpbiBhIHNlbGVjdGVkIG1hcmt1cCBibG9ja1xuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uLm1hcmt1cEJsb2Nrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24ubWFya3VwQmxvY2tzLmluZGV4T2YobGlzdGluZy5tYXJrdXBCbG9jaykgPT09IC0xKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRG9uJ3QgYWRkIGxpc3RpbmdzIHdoYXQgZG9uJ3QgaGF2ZSB0aGUgc2VsZWN0ZWQgYW1lbml0aWVzXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24uYW1lbml0aWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5zZWxlY3Rpb24uYW1lbml0aWVzLmV2ZXJ5KGFtZW5pdHkgPT4gbGlzdGluZy5hbWVuaXRpZXMuaW5kZXhPZihhbWVuaXR5KSAhPT0gLTEpKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5hbGxTZWxlY3RlZExpc3RpbmdzLnB1c2gobGlzdGluZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZGlzcGF0Y2hMaXN0aW5nSGlnaGxpZ2h0KGxpc3Rpbmc6IExpc3RpbmcsIGhpZ2hsaWdodDogYm9vbGVhbikge1xuICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LkhpZ2hsaWdodCwgdGhpcywge1xuICAgICAgICAgICAgbmVpZ2hib3Job29kOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBsaXN0aW5nOiAoaGlnaGxpZ2h0ID8gbGlzdGluZyA6IHVuZGVmaW5lZClcbiAgICAgICAgfSBhcyBkaXNwYXRjaC5IaWdobGlnaHRFdmVudERhdGEpO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBkaXNwYXRjaE5laWdoYm9yaG9vZEhpZ2hsaWdodChuZWlnaGJvcmhvb2Q6IE5laWdoYm9yaG9vZCwgaGlnaGxpZ2h0OiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuSGlnaGxpZ2h0LCB0aGlzLCB7XG4gICAgICAgICAgICBuZWlnaGJvcmhvb2Q6IChoaWdobGlnaHQgPyBuZWlnaGJvcmhvb2QgOiB1bmRlZmluZWQpLFxuICAgICAgICAgICAgbGlzdGluZzogdW5kZWZpbmVkXG4gICAgICAgIH0gYXMgZGlzcGF0Y2guSGlnaGxpZ2h0RXZlbnREYXRhKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZGlzcGF0Y2hMaXN0aW5nU2VsZWN0aW9uKGxpc3Rpbmc6IExpc3RpbmcsIGNyZWF0ZU5ld1NlbGVjdGlvbjogYm9vbGVhbikge1xuICAgICAgICBpZiAoY3JlYXRlTmV3U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICBsZXQgc2VsID0gZGlzcGF0Y2guRGlzcGF0Y2guZW1wdHlTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHNlbC5saXN0aW5ncy5wdXNoKGxpc3RpbmcpO1xuXG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgc2VsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdG8gYWRkIG9yIHJlbW92ZSB0aGlzIGxpc3RpbmcgZnJvbSB0aGUgc2VsZWN0aW9uXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24ubGlzdGluZ3MuaW5kZXhPZihsaXN0aW5nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBMaXN0aW5nIGlzIGFscmVhZHkgc2VsZWN0ZWQsIHNvIHNlbmQgb3V0IGEgc2VsZWN0aW9uIGV2ZW50IHdpdGggdGhpcyBkZXNlbGVjdGVkXG4gICAgICAgICAgICAgICAgbGV0IHNlbCA9IGRpc3BhdGNoLkRpc3BhdGNoLmNsb25lU2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBsZXQgc2VsZWN0ZWRJbmRleCA9IHNlbC5saXN0aW5ncy5pbmRleE9mKGxpc3RpbmcpO1xuICAgICAgICAgICAgICAgIHNlbC5saXN0aW5ncy5zcGxpY2Uoc2VsZWN0ZWRJbmRleCwgMSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgc2VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIExpc3RpbmcgaXMgbm90IGFscmVhZHkgc2VsZWN0ZWQsIHNvIHNlbmQgb3V0IGEgc2VsZWN0aW9uIGV2ZW50IHdpdGggdGhpcyBzZWxlY3RlZFxuICAgICAgICAgICAgICAgIGxldCBzZWwgPSBkaXNwYXRjaC5EaXNwYXRjaC5jbG9uZVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgc2VsLmxpc3RpbmdzLnB1c2gobGlzdGluZyk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgc2VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBkaXNwYXRjaE5laWdoYm9yaG9vZEZpbHRlcihuZWlnaGJvcmhvb2RzOiBOZWlnaGJvcmhvb2RbXSkge1xuICAgICAgICBsZXQgZmlsdGVyID0gZGlzcGF0Y2guRGlzcGF0Y2guY2xvbmVGaWx0ZXIodGhpcy5maWx0ZXIpO1xuICAgICAgICBmaWx0ZXIubmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHMuc2xpY2UoKTtcbiAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmNhbGwoZGlzcGF0Y2guRGlzcGF0Y2hFdmVudC5GaWx0ZXIsIHRoaXMsIGZpbHRlcik7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGRpc3BhdGNoTmVpZ2hib3Job29kU2VsZWN0aW9uKG5laWdoYm9yaG9vZDogTmVpZ2hib3Job29kLCBjcmVhdGVOZXdTZWxlY3Rpb246IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKGNyZWF0ZU5ld1NlbGVjdGlvbikge1xuICAgICAgICAgICAgbGV0IHNlbCA9IGRpc3BhdGNoLkRpc3BhdGNoLmVtcHR5U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBzZWwubmVpZ2hib3Job29kcy5wdXNoKG5laWdoYm9yaG9vZCk7XG5cbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLCBzZWwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0byBhZGQgb3IgcmVtb3ZlIHRoaXMgbmVpZ2hib3Job29kIGZyb20gdGhlIHNlbGVjdGlvblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uLm5laWdoYm9yaG9vZHMuaW5kZXhPZihuZWlnaGJvcmhvb2QpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIC8vIE5laWdoYm9yaG9vZCBpcyBhbHJlYWR5IHNlbGVjdGVkLCBzbyBzZW5kIG91dCBhIHNlbGVjdGlvbiBldmVudCB3aXRoIHRoaXMgZGVzZWxlY3RlZFxuICAgICAgICAgICAgICAgIGxldCBzZWwgPSBkaXNwYXRjaC5EaXNwYXRjaC5jbG9uZVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkSW5kZXggPSBzZWwubmVpZ2hib3Job29kcy5pbmRleE9mKG5laWdoYm9yaG9vZCk7XG4gICAgICAgICAgICAgICAgc2VsLm5laWdoYm9yaG9vZHMuc3BsaWNlKHNlbGVjdGVkSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLHNlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBOZWlnaGJvcmhvb2QgaXMgbm90IGFscmVhZHkgc2VsZWN0ZWQsIHNvIHNlbmQgb3V0IGEgc2VsZWN0aW9uIGV2ZW50IHdpdGggdGhpcyBzZWxlY3RlZFxuICAgICAgICAgICAgICAgIGxldCBzZWwgPSBkaXNwYXRjaC5EaXNwYXRjaC5jbG9uZVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbik7ICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHNlbC5uZWlnaGJvcmhvb2RzLnB1c2gobmVpZ2hib3Job29kKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLCBzZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGRpc3BhdGNoUHJpY2VCbG9ja0ZpbHRlcihwcmljZUJsb2NrczogQmxvY2tbXSkge1xuICAgICAgICBsZXQgZmlsdGVyID0gZGlzcGF0Y2guRGlzcGF0Y2guY2xvbmVGaWx0ZXIodGhpcy5maWx0ZXIpO1xuICAgICAgICBmaWx0ZXIucHJpY2VCbG9ja3MgPSBwcmljZUJsb2Nrcy5zbGljZSgpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LkZpbHRlciwgdGhpcywgZmlsdGVyKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZGlzcGF0Y2hCbG9ja1NlbGVjdGlvbihibG9jazogQmxvY2ssIGNyZWF0ZU5ld1NlbGVjdGlvbjogYm9vbGVhbikge1xuICAgICAgICBpZiAoYmxvY2sudHlwZSA9PT0gJ3ByaWNlJykge1xuICAgICAgICAgICAgaWYgKGNyZWF0ZU5ld1NlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIGxldCBzZWwgPSBkaXNwYXRjaC5EaXNwYXRjaC5lbXB0eVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIHNlbC5wcmljZUJsb2Nrcy5wdXNoKGJsb2NrKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLCBzZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0byBhZGQgb3IgcmVtb3ZlIHRoaXMgcHJpY2UgYmxvY2sgZnJvbSB0aGUgc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uLnByaWNlQmxvY2tzLmluZGV4T2YoYmxvY2spICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBCbG9jayBpcyBhbHJlYWR5IHNlbGVjdGVkLCBzbyBzZW5kIG91dCBhIHNlbGVjdGlvbiBldmVudCB3aXRoIHRoaXMgZGVzZWxlY3RlZFxuICAgICAgICAgICAgICAgICAgICBsZXQgc2VsID0gZGlzcGF0Y2guRGlzcGF0Y2guY2xvbmVTZWxlY3Rpb24odGhpcy5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICBsZXQgc2VsZWN0ZWRJbmRleCA9IHRoaXMuc2VsZWN0aW9uLnByaWNlQmxvY2tzLmluZGV4T2YoYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICBzZWwucHJpY2VCbG9ja3Muc3BsaWNlKHNlbGVjdGVkSW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmNhbGwoZGlzcGF0Y2guRGlzcGF0Y2hFdmVudC5TZWxlY3QsIHRoaXMsIHNlbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBQcmljZSBibG9jayBpcyBub3QgYWxyZWFkeSBzZWxlY3RlZCwgc28gc2VuZCBvdXQgYSBzZWxlY3Rpb24gZXZlbnQgd2l0aCB0aGlzIHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgICAgIGxldCBzZWwgPSBkaXNwYXRjaC5EaXNwYXRjaC5jbG9uZVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIHNlbC5wcmljZUJsb2Nrcy5wdXNoKGJsb2NrKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgc2VsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoY3JlYXRlTmV3U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgbGV0IHNlbCA9IGRpc3BhdGNoLkRpc3BhdGNoLmVtcHR5U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgc2VsLm1hcmt1cEJsb2Nrcy5wdXNoKGJsb2NrKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLCBzZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgd2hldGhlciB0byBhZGQgb3IgcmVtb3ZlIHRoaXMgbWFya3VwIGJsb2NrIGZyb20gdGhlIHNlbGVjdGlvblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbi5tYXJrdXBCbG9ja3MuaW5kZXhPZihibG9jaykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEJsb2NrIGlzIGFscmVhZHkgc2VsZWN0ZWQsIHNvIHNlbmQgb3V0IGEgc2VsZWN0aW9uIGV2ZW50IHdpdGggdGhpcyBkZXNlbGVjdGVkXG4gICAgICAgICAgICAgICAgICAgIGxldCBzZWwgPSBkaXNwYXRjaC5EaXNwYXRjaC5jbG9uZVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzZWxlY3RlZEluZGV4ID0gdGhpcy5zZWxlY3Rpb24ubWFya3VwQmxvY2tzLmluZGV4T2YoYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICBzZWwubWFya3VwQmxvY2tzLnNwbGljZShzZWxlY3RlZEluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLCBzZWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTWFya3VwIGJsb2NrIGlzIG5vdCBhbHJlYWR5IHNlbGVjdGVkLCBzbyBzZW5kIG91dCBhIHNlbGVjdGlvbiBldmVudCB3aXRoIHRoaXMgc2VsZWN0ZWRcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlbCA9IGRpc3BhdGNoLkRpc3BhdGNoLmNsb25lU2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsLm1hcmt1cEJsb2Nrcy5wdXNoKGJsb2NrKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgc2VsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZGlzcGF0Y2hNYXJrdXBCbG9ja0ZpbHRlcihtYXJrdXBCbG9ja3M6IEJsb2NrW10pIHtcbiAgICAgICAgbGV0IGZpbHRlciA9IGRpc3BhdGNoLkRpc3BhdGNoLmNsb25lRmlsdGVyKHRoaXMuZmlsdGVyKTtcbiAgICAgICAgZmlsdGVyLm1hcmt1cEJsb2NrcyA9IG1hcmt1cEJsb2Nrcy5zbGljZSgpO1xuICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LkZpbHRlciwgdGhpcywgZmlsdGVyKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgZGlzcGF0Y2hBbWVuaXR5U2VsZWN0aW9uKGFtZW5pdHk6IHN0cmluZywgY3JlYXRlTmV3U2VsZWN0aW9uOiBib29sZWFuKSB7XG4gICAgICAgIGlmIChjcmVhdGVOZXdTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIGxldCBzZWwgPSBkaXNwYXRjaC5EaXNwYXRjaC5lbXB0eVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgc2VsLmFtZW5pdGllcy5wdXNoKGFtZW5pdHkpO1xuXG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgc2VsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdG8gYWRkIG9yIHJlbW92ZSB0aGlzIGFtZW5pdHkgZnJvbSB0aGUgc2VsZWN0aW9uXG4gICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24uYW1lbml0aWVzLmluZGV4T2YoYW1lbml0eSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgLy8gQW1lbml0eSBpcyBhbHJlYWR5IHNlbGVjdGVkLCBzbyBzZW5kIG91dCBhIHNlbGVjdGlvbiBldmVudCB3aXRoIHRoaXMgZGVzZWxlY3RlZFxuICAgICAgICAgICAgICAgIGxldCBzZWwgPSBkaXNwYXRjaC5EaXNwYXRjaC5jbG9uZVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkSW5kZXggPSB0aGlzLnNlbGVjdGlvbi5hbWVuaXRpZXMuaW5kZXhPZihhbWVuaXR5KTtcbiAgICAgICAgICAgICAgICBzZWwuYW1lbml0aWVzLnNwbGljZShzZWxlY3RlZEluZGV4LCAxKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLCBzZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQW1lbml0eSBpcyBub3QgYWxyZWFkeSBzZWxlY3RlZCwgc28gc2VuZCBvdXQgYSBzZWxlY3Rpb24gZXZlbnQgd2l0aCB0aGlzIHNlbGVjdGVkXG4gICAgICAgICAgICAgICAgbGV0IHNlbCA9IGRpc3BhdGNoLkRpc3BhdGNoLmNsb25lU2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBzZWwuYW1lbml0aWVzLnB1c2goYW1lbml0eSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChkaXNwYXRjaC5EaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgc2VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBkaXNwYXRjaEFtZW5pdHlGaWx0ZXIoYW1lbml0aWVzOiBzdHJpbmdbXSkge1xuICAgICAgICBsZXQgZmlsdGVyID0gZGlzcGF0Y2guRGlzcGF0Y2guY2xvbmVGaWx0ZXIodGhpcy5maWx0ZXIpO1xuICAgICAgICBmaWx0ZXIuYW1lbml0aWVzID0gYW1lbml0aWVzLnNsaWNlKCk7XG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKGRpc3BhdGNoLkRpc3BhdGNoRXZlbnQuRmlsdGVyLCB0aGlzLCBmaWx0ZXIpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkxvYWQoZGF0YTogZGlzcGF0Y2guTG9hZEV2ZW50RGF0YSkgOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5maWx0ZXJlZExpc3RpbmdzID0gQXJyYXkuZnJvbShkYXRhLmxpc3RpbmdzLnZhbHVlcygpKTtcbiAgICAgICAgdGhpcy5maWx0ZXJlZExpc3RpbmdzTWFwID0gbmV3IE1hcCh0aGlzLmZpbHRlcmVkTGlzdGluZ3MubWFwKChsKTpbTGlzdGluZy5JRFR5cGUsIExpc3RpbmddID0+IFtsLmlkLCBsXSkpO1xuICAgICAgICB0aGlzLmZpbHRlcmVkTmVpZ2hib3Job29kcyA9IEFycmF5LmZyb20oZGF0YS5uZWlnaGJvcmhvb2RzLnZhbHVlcygpKTtcbiAgICAgICAgdGhpcy5maWx0ZXJlZE5laWdoYm9yaG9vZE1hcCA9IG5ldyBNYXAodGhpcy5maWx0ZXJlZE5laWdoYm9yaG9vZHMubWFwKChuKTpbTmVpZ2hib3Job29kLk5hbWVUeXBlLCBOZWlnaGJvcmhvb2RdID0+IFtuLm5hbWUsIG5dKSk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uU2VsZWN0KHNlbGVjdGlvbjogZGlzcGF0Y2guU2VsZWN0RXZlbnREYXRhKSA6IHZvaWQge1xuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5jb21wdXRlQWxsU2VsZWN0ZWRMaXN0aW5ncygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkhpZ2hsaWdodChoaWdobGlnaHQ6IGRpc3BhdGNoLkhpZ2hsaWdodEV2ZW50RGF0YSkgOiB2b2lkIHtcbiAgICAgICAgdGhpcy5oaWdobGlnaHQgPSBoaWdobGlnaHQ7XG4gICAgfVxuICAgIFxuICAgIHB1YmxpYyBvbkZpbHRlcihmaWx0ZXI6IGRpc3BhdGNoLkZpbHRlckV2ZW50RGF0YSkgOiB2b2lkIHtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIHRoaXMuZmlsdGVyZWRMaXN0aW5ncyA9IFtdO1xuXG4gICAgICAgIGlmIChmaWx0ZXIubmVpZ2hib3Job29kcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyZWROZWlnaGJvcmhvb2RzID0gZmlsdGVyLm5laWdoYm9yaG9vZHMuc2xpY2UoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyZWROZWlnaGJvcmhvb2RzID0gQXJyYXkuZnJvbSh0aGlzLmRhdGEubmVpZ2hib3Job29kcy52YWx1ZXMoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBsaXN0aW5nIG9mIEFycmF5LmZyb20odGhpcy5kYXRhLmxpc3RpbmdzLnZhbHVlcygpKSkge1xuICAgICAgICAgICAgLy8gRG9uJ3QgYWRkIGxpc3RpbmdzIG5vdCBpbiBhIGZpbHRlciBuZWlnaGJvcmhvb2RcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlci5uZWlnaGJvcmhvb2RzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlci5uZWlnaGJvcmhvb2RzLmluZGV4T2YobGlzdGluZy5uZWlnaGJvcmhvb2QpID09PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvbid0IGFkZCBsaXN0aW5ncyBub3QgaW4gYSBmaWx0ZXIgcHJpY2UgYmxvY2tcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlci5wcmljZUJsb2Nrcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maWx0ZXIucHJpY2VCbG9ja3MuaW5kZXhPZihsaXN0aW5nLnByaWNlQmxvY2spID09PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvbid0IGFkZCBsaXN0aW5ncyBub3QgaW4gYSBzZWxlY3RlZCBtYXJrdXAgYmxvY2tcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlci5tYXJrdXBCbG9ja3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyLm1hcmt1cEJsb2Nrcy5pbmRleE9mKGxpc3RpbmcubWFya3VwQmxvY2spID09PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvbid0IGFkZCBsaXN0aW5ncyB3aGF0IGRvbid0IGhhdmUgdGhlIHNlbGVjdGVkIGFtZW5pdGllc1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyLmFtZW5pdGllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZmlsdGVyLmFtZW5pdGllcy5ldmVyeShhbWVuaXR5ID0+IGxpc3RpbmcuYW1lbml0aWVzLmluZGV4T2YoYW1lbml0eSkgIT09IC0xKSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZmlsdGVyZWRMaXN0aW5ncy5wdXNoKGxpc3RpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5maWx0ZXJlZExpc3RpbmdzTWFwID0gbmV3IE1hcCh0aGlzLmZpbHRlcmVkTGlzdGluZ3MubWFwKChsKTpbTGlzdGluZy5JRFR5cGUsIExpc3RpbmddID0+IFtsLmlkLCBsXSkpO1xuICAgICAgICB0aGlzLmZpbHRlcmVkTmVpZ2hib3Job29kTWFwID0gbmV3IE1hcCh0aGlzLmZpbHRlcmVkTmVpZ2hib3Job29kcy5tYXAoKG4pOltOZWlnaGJvcmhvb2QuTmFtZVR5cGUsIE5laWdoYm9yaG9vZF0gPT4gW24ubmFtZSwgbl0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWJzdHJhY3QgcmVzaXplKCk7XG4gICAgcHVibGljIGFic3RyYWN0IHJlbmRlcigpO1xufSIsImltcG9ydCAqIGFzIGQzIGZyb20gJy4uL2QzJztcbmltcG9ydCB7IExpc3RpbmcsIE5laWdoYm9yaG9vZCB9IGZyb20gJy4vbGlzdGluZyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXR0cmlidXRlIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgYWNjZXNzb3I6IChsaXN0aW5nOiBMaXN0aW5nKSA9PiBhbnk7IFxuICAgIG5laWdoYm9yaG9vZEFjY2Vzc29yOiAobmVpZ2hib3Job29kOiBOZWlnaGJvcmhvb2QpID0+IGFueTtcblxuICAgIGtpbmQ6ICdjb250aW51b3VzJyB8ICdvcmRpbmFsJztcbiAgICBsaXN0aW5nRG9tYWluPzogKGRhdGE6IExpc3RpbmdbXSkgPT4gYW55O1xuICAgIG5laWdoYm9yaG9vZERvbWFpbj86IChkYXRhOiBOZWlnaGJvcmhvb2RbXSkgPT4gYW55O1xufVxuXG5leHBvcnQgbW9kdWxlIEF0dHJpYnV0ZSB7XG4gICAgZXhwb3J0IHZhciBjb3VudDogQXR0cmlidXRlID0ge1xuICAgICAgICBuYW1lOiAnQ291bnQnLFxuICAgICAgICBhY2Nlc3NvcjogbCA9PiAxLFxuICAgICAgICBuZWlnaGJvcmhvb2RBY2Nlc3NvcjogbiA9PiBuLmxpc3RpbmdzLmxlbmd0aCxcbiAgICAgICAga2luZDogJ2NvbnRpbnVvdXMnXG4gICAgfTtcblxuICAgIGV4cG9ydCB2YXIgcmF0aW5nOiBBdHRyaWJ1dGUgPSB7IFxuICAgICAgICBuYW1lOiAnUmF0aW5nJywgXG4gICAgICAgIGFjY2Vzc29yOiBsID0+IGwucmV2aWV3cy5yYXRpbmcsIFxuICAgICAgICBuZWlnaGJvcmhvb2RBY2Nlc3NvcjogbiA9PiBkMy5tZWFuKG4ubGlzdGluZ3MsIGwgPT4gbC5yZXZpZXdzLnJhdGluZyksXG4gICAgICAgIGtpbmQ6ICdjb250aW51b3VzJ1xuICAgIH07XG5cbiAgICBleHBvcnQgdmFyIHByaWNlOiBBdHRyaWJ1dGUgPSB7XG4gICAgICAgIG5hbWU6ICdBaXJibmIgRGFpbHkgUHJpY2UnLCBcbiAgICAgICAgYWNjZXNzb3I6IGwgPT4gbC5wcmljZXMuYWlyYm5iLmRhaWx5LCBcbiAgICAgICAgbmVpZ2hib3Job29kQWNjZXNzb3I6IG4gPT4gZDMubWVkaWFuKG4ubGlzdGluZ3MsIGwgPT4gbC5wcmljZXMuYWlyYm5iLmRhaWx5KSxcbiAgICAgICAga2luZDogJ2NvbnRpbnVvdXMnXG4gICAgfTtcblxuICAgIGV4cG9ydCB2YXIgbW9udGhseVByaWNlOiBBdHRyaWJ1dGUgPSB7XG4gICAgICAgIG5hbWU6ICdNb250aGx5IFByaWNlIFBlciBCZWRyb29tJywgXG4gICAgICAgIGFjY2Vzc29yOiBsID0+IGwucHJpY2VzLmFpcmJuYi5tb250aGx5X3Blcl9iZWRyb29tLCBcbiAgICAgICAgbmVpZ2hib3Job29kQWNjZXNzb3I6IG4gPT4gZDMubWVkaWFuKG4ubGlzdGluZ3MsIGwgPT4gbC5wcmljZXMuYWlyYm5iLm1vbnRobHlfcGVyX2JlZHJvb20pLFxuICAgICAgICBraW5kOiAnY29udGludW91cydcbiAgICB9O1xuXG4gICBleHBvcnQgdmFyIHRydWxpYVByaWNlOiBBdHRyaWJ1dGUgPSB7XG4gICAgICAgIG5hbWU6ICdUcnVsaWEgRGFpbHkgUHJpY2UnLCBcbiAgICAgICAgYWNjZXNzb3I6IGwgPT4gbC5wcmljZXMudHJ1bGlhLnJlbnRfcGVyX2JlZHJvb20vMzAsIFxuICAgICAgICBuZWlnaGJvcmhvb2RBY2Nlc3NvcjogbiA9PiBkMy5tZWRpYW4obi5saXN0aW5ncywgbCA9PiAobC5wcmljZXMudHJ1bGlhLnJlbnRfcGVyX2JlZHJvb20vMzApKSxcbiAgICAgICAga2luZDogJ2NvbnRpbnVvdXMnXG4gICAgfTtcblxuICAgIGV4cG9ydCB2YXIgbWFya3VwOiBBdHRyaWJ1dGUgPSB7XG4gICAgICAgIG5hbWU6ICdNYXJrdXAnLCBcbiAgICAgICAgYWNjZXNzb3I6IGwgPT4gbC5wcmljZXMubWFya3VwX3BlcmNlbnRhZ2UsIFxuICAgICAgICBuZWlnaGJvcmhvb2RBY2Nlc3NvcjogbiA9PiBkMy5tZWRpYW4obi5saXN0aW5ncywgbCA9PiBsLnByaWNlcy5tYXJrdXBfcGVyY2VudGFnZSksXG4gICAgICAgIGtpbmQ6ICdjb250aW51b3VzJ1xuICAgIH07XG5cbiAgICAgIGV4cG9ydCB2YXIgbnVtYmVyT2ZSZXZpZXdzOiBBdHRyaWJ1dGUgPSB7XG4gICAgICAgIG5hbWU6ICdOdW1iZXIgb2YgUmV2aWV3cycsIFxuICAgICAgICBhY2Nlc3NvcjogbCA9PiBsLnJldmlld3MubnVtYmVyX29mX3Jldmlld3MsIFxuICAgICAgICBuZWlnaGJvcmhvb2RBY2Nlc3NvcjogbiA9PiBkMy5tZWRpYW4obi5saXN0aW5ncywgbCA9PiBsLnJldmlld3MubnVtYmVyX29mX3Jldmlld3MpLFxuICAgICAgICBraW5kOiAnY29udGludW91cydcbiAgICB9O1xuXG4gICAgICAgZXhwb3J0IHZhciBudW1iZXJPZkhvc3RMaXN0aW5nczogQXR0cmlidXRlID0ge1xuICAgICAgICBuYW1lOiAnTnVtYmVyIG9mIEhvc3QgTGlzdGluZ3MnLCBcbiAgICAgICAgYWNjZXNzb3I6IGwgPT4gbC5ob3N0X2xpc3RpbmdzX2NvdW50LCBcbiAgICAgICAgbmVpZ2hib3Job29kQWNjZXNzb3I6IG4gPT4gZDMubWVkaWFuKG4ubGlzdGluZ3MsIGwgPT4gbC5ob3N0X2xpc3RpbmdzX2NvdW50KSxcbiAgICAgICAga2luZDogJ2NvbnRpbnVvdXMnXG4gICAgfTtcblxuXG4gICAgZXhwb3J0IHZhciBjYW5jZWxsYXRpb25Qb2xpY3k6IEF0dHJpYnV0ZSA9IHsgXG4gICAgICAgIG5hbWU6ICdDYW5jZWxsYXRpb24gUG9saWN5JywgXG4gICAgICAgIGFjY2Vzc29yOiBsID0+IGwuY2FuY2VsbGF0aW9uX3BvbGljeSxcbiAgICAgICAgbmVpZ2hib3Job29kQWNjZXNzb3I6IG4gPT4gbi5saXN0aW5nc1swXS5jYW5jZWxsYXRpb25fcG9saWN5LFxuICAgICAgICBraW5kOiAnb3JkaW5hbCcsXG4gICAgICAgIGxpc3RpbmdEb21haW46IChkYXRhKSA9PiBbJ2ZsZXhpYmxlJywgJ21vZGVyYXRlJywgJ3N0cmljdCcsICdzdXBlcl9zdHJpY3RfMzAnLCAnc3VwZXJfc3RyaWN0XzYwJ10sXG4gICAgICAgIG5laWdoYm9yaG9vZERvbWFpbjogKGRhdGEpID0+IFsnZmxleGlibGUnLCAnbW9kZXJhdGUnLCAnc3RyaWN0JywgJ3N1cGVyX3N0cmljdF8zMCcsICdzdXBlcl9zdHJpY3RfNjAnXVxuICAgIH07XG5cbiAgICAgIGV4cG9ydCB2YXIgbnVtYmVyT2ZHdWVzdEluY2x1ZGVkOiBBdHRyaWJ1dGUgPSB7XG4gICAgICAgIG5hbWU6ICdOdW1iZXIgb2YgR3Vlc3QgSW5jbHVkZWQnLCBcbiAgICAgICAgYWNjZXNzb3I6IGwgPT4gbC5ndWVzdHNfaW5jbHVkZWQsIFxuICAgICAgICBuZWlnaGJvcmhvb2RBY2Nlc3NvcjogbiA9PiBkMy5tZWRpYW4obi5saXN0aW5ncywgbCA9PiBsLmd1ZXN0c19pbmNsdWRlZCksXG4gICAgICAgIGtpbmQ6ICdjb250aW51b3VzJ1xuICAgIH07XG5cbiAgICAvLyBTZXQgZGVmYXVsdCBkb21haW4gYWNjZXNzb3JzXG4gICAgZm9yIChsZXQgYXR0ciBvZiBbY291bnQsIHJhdGluZywgcHJpY2UsIG1vbnRobHlQcmljZSwgbWFya3VwLHRydWxpYVByaWNlLG51bWJlck9mUmV2aWV3cyxudW1iZXJPZkhvc3RMaXN0aW5ncyxudW1iZXJPZkd1ZXN0SW5jbHVkZWRdKSB7XG4gICAgICAgIGF0dHIubGlzdGluZ0RvbWFpbiA9IChkYXRhKSA9PiBkMy5leHRlbnQoZGF0YSwgZCA9PiBhdHRyLmFjY2Vzc29yKGQpKTtcbiAgICAgICAgYXR0ci5uZWlnaGJvcmhvb2REb21haW4gPSAoZGF0YSkgPT4gZDMuZXh0ZW50KGRhdGEsIGQgPT4gYXR0ci5uZWlnaGJvcmhvb2RBY2Nlc3NvcihkKSk7XG4gICAgfVxufSIsImltcG9ydCAqIGFzIGQzIGZyb20gJy4uL2QzJztcblxuaW1wb3J0IHsgQmFzZUNvbXBvbmVudCB9IGZyb20gJy4vYmFzZS1jb21wb25lbnQnO1xuaW1wb3J0IHsgRGlzcGF0Y2gsIERpc3BhdGNoRXZlbnQsIExvYWRFdmVudERhdGEsIFNlbGVjdEV2ZW50RGF0YSwgSGlnaGxpZ2h0RXZlbnREYXRhLCBGaWx0ZXJFdmVudERhdGEgfSBmcm9tICcuLi9kYXRhL2Rpc3BhdGNoJztcbmltcG9ydCB7IE5laWdoYm9yaG9vZEdlb0pTT04sIE5laWdoYm9yaG9vZEdlb0pTT05GZWF0dXJlIH0gZnJvbSAnLi4vZGF0YS9nZW9qc29uJztcbmltcG9ydCB7IEF0dHJpYnV0ZSB9IGZyb20gJy4uL2RhdGEvYXR0cmlidXRlJztcbmltcG9ydCB7IExpc3RpbmcsIE5laWdoYm9yaG9vZCB9IGZyb20gJy4uL2RhdGEvbGlzdGluZyc7XG5cbmludGVyZmFjZSBMZWdlbmRJdGVtIHtcbiAgICByZXByZXNlbnRhdGl2ZTogbnVtYmVyLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBtaW46IG51bWJlcixcbiAgICBtYXg6IG51bWJlclxufVxuXG5leHBvcnQgY2xhc3MgTmVpZ2hib3Job29kTWFwQ29tcG9uZW50IGV4dGVuZHMgQmFzZUNvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIHZpZXc6IHtcbiAgICAgICAgc3ZnPzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgICAgIHBhdGhzQ29udGFpbmVyPzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgICAgIHBhdGhzPzogZDMuRGF0YVNlbGVjdGlvbjxOZWlnaGJvcmhvb2RHZW9KU09ORmVhdHVyZT47XG4gICAgICAgIGxlZ2VuZD86IGQzLkRhdGFTZWxlY3Rpb248TGVnZW5kSXRlbT47XG4gICAgICAgIG1vbmV5Rm9ybWF0PzogKG46bnVtYmVyKSA9PiBzdHJpbmc7XG4gICAgfVxuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHNlbGVjdG9yOiBzdHJpbmcsIGRpc3BhdGNoZXI6IERpc3BhdGNoKSB7XG4gICAgICAgIHN1cGVyKHNlbGVjdG9yLCBkaXNwYXRjaGVyKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIG91ciBjYW52YXNcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5lbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0ID0gdGhpcy5lbGVtZW50LmNsaWVudEhlaWdodDtcblxuICAgICAgICB0aGlzLnZpZXcgPSB7fTtcbiAgICAgICAgdGhpcy52aWV3Lm1vbmV5Rm9ybWF0ID0gZDMuZm9ybWF0KCckLjJmJyk7XG4gICAgICAgIHRoaXMudmlldy5zdmcgPSBkMy5zZWxlY3QodGhpcy5zZWxlY3RvcikuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ21hcC1jaGFydCcpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpO1xuICAgICAgICB0aGlzLnZpZXcucGF0aHNDb250YWluZXIgPSB0aGlzLnZpZXcuc3ZnLmFwcGVuZCgnZycpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbWFwLWNvbnRhaW5lcicpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwIC0yMCknKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRpYWxpemVMZWdlbmQoKSB7XG4gICAgICAgIGxldCB3aWR0aCA9IHRoaXMuZWxlbWVudC5jbGllbnRXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IHRoaXMuZWxlbWVudC5jbGllbnRIZWlnaHQ7XG5cbiAgICAgICAgbGV0IGxlZ2VuZEdyb3VwID0gdGhpcy52aWV3LnN2Z1xuICAgICAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xlZ2VuZCcpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgYHRyYW5zbGF0ZSgxMCwgJHtoZWlnaHQgLSAzMH0pYCk7XG5cbiAgICAgICAgbGV0IGxlZ2VuZEl0ZW1zOiBMZWdlbmRJdGVtW10gPSBbXG4gICAgICAgICAgICB7IHJlcHJlc2VudGF0aXZlOiAwLCB0ZXh0OiAnJDAgLSAkMjAwJywgbWluOiAwLCBtYXg6IDIwMCB9LFxuICAgICAgICAgICAgeyByZXByZXNlbnRhdGl2ZTogMjAwLCB0ZXh0OiAnJDIwMCAtICQzMDAnLCBtaW46IDIwMCwgbWF4OiAzMDAgfSxcbiAgICAgICAgICAgIHsgcmVwcmVzZW50YXRpdmU6IDMwMCwgdGV4dDogJyQzMDAgLSAkNDAwJywgbWluOiAzMDAsIG1heDogNDAwIH0sXG4gICAgICAgICAgICB7IHJlcHJlc2VudGF0aXZlOiA0MDAsIHRleHQ6ICckNDAwIC0gJDYwMCcsIG1pbjogNDAwLCBtYXg6IDYwMCB9LFxuICAgICAgICAgICAgeyByZXByZXNlbnRhdGl2ZTogNjAwLCB0ZXh0OiAnJDYwMCAtICQxMDAwJywgbWluOiA2MDAsIG1heDogMTAwMCB9LFxuICAgICAgICAgICAgeyByZXByZXNlbnRhdGl2ZTogMTAwMCwgdGV4dDogJyQxMDAwIC0gJDE2MDAnLCBtaW46IDEwMDAsIG1heDogMTYwMCB9XG4gICAgICAgIF07XG5cbiAgICAgICAgbGV0IGl0ZW1XaWR0aCA9ICh3aWR0aCAtIDIwKSAvIGxlZ2VuZEl0ZW1zLmxlbmd0aDtcbiAgICAgICAgbGV0IHJlY3RTaXplID0gMTI7XG5cbiAgICAgICAgbGV0IGl0ZW1TZWxlY3Rpb24gPSBsZWdlbmRHcm91cFxuICAgICAgICAgIC5zZWxlY3RBbGwoJ2cubGVnZW5kLWl0ZW0nKVxuICAgICAgICAgICAgLmRhdGEobGVnZW5kSXRlbXMpO1xuXG4gICAgICAgIGxldCBpdGVtRW50ZXIgPSBpdGVtU2VsZWN0aW9uXG4gICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsZWdlbmQtaXRlbScpXG4gICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgKGQsaSkgPT4gYHRyYW5zbGF0ZSgke2kqaXRlbVdpZHRofSwgMClgKTtcbiAgICAgICAgaXRlbUVudGVyXG4gICAgICAgICAgLmFwcGVuZCgncmVjdCcpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCByZWN0U2l6ZSlcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCByZWN0U2l6ZSlcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGQgPT4gdGhpcy5nZXRDb2xvcihkLnJlcHJlc2VudGF0aXZlKSk7XG4gICAgICAgIGl0ZW1FbnRlclxuICAgICAgICAgIC5hcHBlbmQoJ3RleHQnKVxuICAgICAgICAgICAgLnRleHQoZCA9PiBkLnRleHQpXG4gICAgICAgICAgICAuYXR0cigneCcsIHJlY3RTaXplICsgMilcbiAgICAgICAgICAgIC5hdHRyKCd5JywgcmVjdFNpemUgLyAyKTtcblxuICAgICAgICB0aGlzLnZpZXcubGVnZW5kID0gaXRlbVNlbGVjdGlvbi5tZXJnZShpdGVtRW50ZXIpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkxvYWQoZGF0YTogTG9hZEV2ZW50RGF0YSkge1xuICAgICAgICBzdXBlci5vbkxvYWQoZGF0YSk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUxlZ2VuZCgpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvblNlbGVjdChzZWxlY3Rpb246IFNlbGVjdEV2ZW50RGF0YSkge1xuICAgICAgICBzdXBlci5vblNlbGVjdChzZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLnZpZXcucGF0aHMuYXR0cignZmlsbCcsIGQgPT4gdGhpcy5nZXROZWlnaGJvcmhvb2RSZWdpb24odGhpcy5maWx0ZXJlZE5laWdoYm9yaG9vZE1hcC5nZXQoZC5wcm9wZXJ0aWVzLm5laWdoYm9yaG8pKSk7XG4gICAgICAgIFxuICAgIH1cblxuICAgIHB1YmxpYyBvbkhpZ2hsaWdodChoaWdobGlnaHQ6IEhpZ2hsaWdodEV2ZW50RGF0YSkge1xuICAgICAgICBzdXBlci5vbkhpZ2hsaWdodChoaWdobGlnaHQpO1xuICAgICAgICB0aGlzLnZpZXcucGF0aHMuYXR0cignZmlsbCcsIGQgPT4gdGhpcy5nZXROZWlnaGJvcmhvb2RSZWdpb24odGhpcy5maWx0ZXJlZE5laWdoYm9yaG9vZE1hcC5nZXQoZC5wcm9wZXJ0aWVzLm5laWdoYm9yaG8pKSk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRmlsdGVyKGZpbHRlcjogRmlsdGVyRXZlbnREYXRhKSB7XG4gICAgICAgIHN1cGVyLm9uRmlsdGVyKGZpbHRlcik7XG4gICAgICAgIHRoaXMudmlldy5wYXRocy5hdHRyKCdmaWxsJywgZCA9PiB0aGlzLmdldE5laWdoYm9yaG9vZFJlZ2lvbih0aGlzLmZpbHRlcmVkTmVpZ2hib3Job29kTWFwLmdldChkLnByb3BlcnRpZXMubmVpZ2hib3JobykpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzaXplKCkge1xuXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXROZWlnaGJvcmhvb2RSZWdpb24obmVpZ2hib3Job29kOk5laWdoYm9yaG9vZCk6IHN0cmluZyB7XG4gICAgICAgIGlmKG5laWdoYm9yaG9vZCA9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuICdncmV5JztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQW55IGhpZ2hsaWdodGVkIG5laWdoYm9yaG9vZCBzaG91bGQgYWx3YXlzIGJlIHJlZFxuICAgICAgICBpZiAoKG5laWdoYm9yaG9vZCA9PT0gdGhpcy5oaWdobGlnaHQubmVpZ2hib3Job29kKSB8fCAodGhpcy5oaWdobGlnaHQubGlzdGluZyAmJiB0aGlzLmhpZ2hsaWdodC5saXN0aW5nLm5laWdoYm9yaG9vZCA9PT0gbmVpZ2hib3Job29kKSkge1xuICAgICAgICAgICAgcmV0dXJuICdyZ2JhKDI1NSwgMTAwLCAxMDAsIDAuNSknO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlcmUgaXMgYSBzZWxlY3Rpb24gYnV0IGl0IHlpZWxkcyBubyBsaXN0aW5nc1xuICAgICAgICBpZiAoIURpc3BhdGNoLmlzRW1wdHlTZWxlY3Rpb24odGhpcy5zZWxlY3Rpb24pICYmIHRoaXMuYWxsU2VsZWN0ZWRMaXN0aW5ncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNoYWRlT2ZHcmVlbihuZWlnaGJvcmhvb2QpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIG5laWdoYm9yaG9vZCBpcyBzZWxlY3RlZFxuICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24ubmVpZ2hib3Job29kcy5pbmRleE9mKG5laWdoYm9yaG9vZCkgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3JnYmEoMjU1LCAxMDAsIDEwMCwgMC41KSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFNvbWUgb2YgdGhlIHNlbGVjdGVkIGxpc3RpbmdzIGJlbG9uZyBpbiB0aGlzIG5laWdoYm9yaG9vZFxuICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24ubGlzdGluZ3MubGVuZ3RoICYmIHRoaXMuYWxsU2VsZWN0ZWRMaXN0aW5ncy5zb21lKGwgPT4gbC5uZWlnaGJvcmhvb2QgPT09IG5laWdoYm9yaG9vZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3JnYmEoMjU1LCAxMDAsIDEwMCwgMC41KSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLnNoYWRlT2ZHcmVlbihuZWlnaGJvcmhvb2QpO1xuICAgIH1cblxuLy9yZXR1cm5zIHNoYWRlIG9mIGdyZWVuXG4gICAgcHVibGljIHNoYWRlT2ZHcmVlbihuZWlnaGJvcmhvb2Q6TmVpZ2hib3Job29kKTpzdHJpbmd7XG4gICAgICAgIGxldCBhdmVyYWdlID0gQXR0cmlidXRlLnByaWNlLm5laWdoYm9yaG9vZEFjY2Vzc29yKG5laWdoYm9yaG9vZCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29sb3IoYXZlcmFnZSk7XG4gICAgICAgIFxuICAgIH1cbi8vcmV0dXJuIGdyZWVuIGJhc2VkIG9uIHByaWNlXG4vL2NvbG9yIHNjYWxlOiBodHRwczovL2NvbG9yLmFkb2JlLmNvbS9ncmVlbnMtY29sb3ItdGhlbWUtNzMzNDc2MS9lZGl0Lz9jb3B5PXRydWUmYmFzZT0yJnJ1bGU9Q3VzdG9tJnNlbGVjdGVkPTQmbmFtZT1Db3B5JTIwb2YlMjBncmVlbnMmbW9kZT1oc3YmcmdidmFsdWVzPTAsMC4xNSwwLjA5OTk5OTU5OTk5OTk3ODI4LDAuMDEzNTAwMDAwMDAwMDAwMDE0LDAuMjcsMC4xNDYwMjQzMTU5OTk5OTc4NSwwLjA3ODIwMDAwMDAwMDAwMDAyLDAuNDYsMC4yMDU0NjY5MjExOTk4ODM2MywwLjIxMTcwMDAwMDAwMDAwMDAzLDAuNzMsMC4yNzIxNjkwMjQzOTk4MjU0LDAuNDk0NTUwOTU0MDAwMTQ5MzcsMC45LDAuNDIzJnN3YXRjaE9yZGVyPTAsMSwyLDMsNCBmb3IgZWFjaCBncmVlblxuICAgIHByaXZhdGUgZ2V0Q29sb3IoYXZlcmFnZU5laWdoYm9yaG9vZFByaWNlKTpzdHJpbmd7XG5cbiAgICAgICAgaWYoYXZlcmFnZU5laWdoYm9yaG9vZFByaWNlPj0wICYmIGF2ZXJhZ2VOZWlnaGJvcmhvb2RQcmljZSA8IDIwMCApe1xuICAgICAgICAgICAgcmV0dXJuICdyZ2IoMjA0LDIzNiwyMzApJztcbiAgICAgICAgfWVsc2UgaWYoYXZlcmFnZU5laWdoYm9yaG9vZFByaWNlPj0yMDAgJiYgYXZlcmFnZU5laWdoYm9yaG9vZFByaWNlPCAzMDAgKXtcbiAgICAgICAgICAgIHJldHVybiAncmdiKDE1MywyMTYsMjAxKSc7XG4gICAgICAgIH1lbHNlIGlmKGF2ZXJhZ2VOZWlnaGJvcmhvb2RQcmljZT49MzAwICYmIGF2ZXJhZ2VOZWlnaGJvcmhvb2RQcmljZTw0MDAgKXtcbiAgICAgICAgICAgIHJldHVybiAncmdiKDEwMiwxOTQsMTY0KSc7XG4gICAgICAgIH1lbHNlIGlmKGF2ZXJhZ2VOZWlnaGJvcmhvb2RQcmljZT49NDAwICYmIGF2ZXJhZ2VOZWlnaGJvcmhvb2RQcmljZTw2MDAgKXtcbiAgICAgICAgICAgIHJldHVybiAncmdiKDY1LDE3NCwxMTgpJztcbiAgICAgICAgfWVsc2UgaWYoYXZlcmFnZU5laWdoYm9yaG9vZFByaWNlPj02MDAgJiYgYXZlcmFnZU5laWdoYm9yaG9vZFByaWNlPDEwMDApe1xuICAgICAgICAgICAgcmV0dXJuICdyZ2IoMzUsMTM5LDY5KSdcbiAgICAgICAgfWVsc2UgaWYoYXZlcmFnZU5laWdoYm9yaG9vZFByaWNlPj0xMDAwICYmIGF2ZXJhZ2VOZWlnaGJvcmhvb2RQcmljZTwxNjAwKXtcbiAgICAgICAgICAgIHJldHVybiAncmdiKDAsODgsMzYpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAncmdiKDM4LDM4LDM4KSc7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXROZWlnaGJvcmhvb2RBdmVyYWdlcygpe1xuICAgICAgICBcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5lbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0ID0gdGhpcy5lbGVtZW50LmNsaWVudEhlaWdodDtcblxuICAgICAgICBsZXQgcHJvamVjdGlvbiA9IGQzLmdlb01lcmNhdG9yKClcbiAgICAgICAgICAgIC5zY2FsZSgxKVxuICAgICAgICAgICAgLnRyYW5zbGF0ZShbMCwgMF0pXG4gICAgICAgICAgICAucHJlY2lzaW9uKDApO1xuICAgICAgICAgICAgXG4gICAgICAgIGxldCBwYXRoID0gZDMuZ2VvUGF0aCgpLnByb2plY3Rpb24ocHJvamVjdGlvbik7XG4gICAgICAgIGxldCBib3VuZHMgPSBwYXRoLmJvdW5kcyh0aGlzLmRhdGEuZ2VvKTtcblxuICAgICAgICBsZXQgeFNjYWxlID0gd2lkdGggLyBNYXRoLmFicyhib3VuZHNbMV1bMF0gLSBib3VuZHNbMF1bMF0pO1xuICAgICAgICBsZXQgeVNjYWxlID0gaGVpZ2h0IC8gTWF0aC5hYnMoYm91bmRzWzFdWzFdIC0gYm91bmRzWzBdWzFdKTtcbiAgICAgICAgbGV0IHNjYWxlID0geFNjYWxlIDwgeVNjYWxlID8geFNjYWxlIDogeVNjYWxlO1xuICAgICAgICBsZXQgdHJhbnNsOiBbbnVtYmVyLCBudW1iZXJdID0gW1xuICAgICAgICAgICAgKHdpZHRoIC0gc2NhbGUgKiAoYm91bmRzWzFdWzBdICsgYm91bmRzWzBdWzBdKSkgLyAyLCBcbiAgICAgICAgICAgIChoZWlnaHQgLSBzY2FsZSAqIChib3VuZHNbMV1bMV0gKyBib3VuZHNbMF1bMV0pKSAvIDJcbiAgICAgICAgXTtcblxuICAgICAgICBwcm9qZWN0aW9uXG4gICAgICAgICAgICAuc2NhbGUoc2NhbGUpXG4gICAgICAgICAgICAudHJhbnNsYXRlKHRyYW5zbCk7XG5cbiAgICAgICAgXG4gICAgICAgIGxldCBwYXRoc1NlbGVjdGlvbiA9IHRoaXMudmlldy5wYXRoc0NvbnRhaW5lci5zZWxlY3RBbGwoJ3BhdGgnKVxuICAgICAgICAgICAgLmRhdGEodGhpcy5kYXRhLmdlby5mZWF0dXJlcywgZCA9PiBkWydpZCddKTtcblxuICAgICAgICAvLyBEcmF3IGFsbCB0aGUgbmVpZ2hib3Job29kcyBmb3IgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgbGV0IHBhdGhzRW50ZXIgPSBwYXRoc1NlbGVjdGlvbi5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgncGF0aCcpXG4gICAgICAgICAgICAuYXR0cignZCcsIHBhdGgpXG4gICAgICAgICAgICAuYXR0cignZGF0YS1pZCcsIGQgPT4gZC5pZClcbiAgICAgICAgICAgIC5hdHRyKCdkYXRhLW5hbWUnLCBkID0+IGQucHJvcGVydGllcy5uZWlnaGJvcmhvKVxuICAgICAgICAgICAgLmF0dHIoJ2ZpbGwnLCBkID0+IHRoaXMuZ2V0TmVpZ2hib3Job29kUmVnaW9uKHRoaXMuZmlsdGVyZWROZWlnaGJvcmhvb2RNYXAuZ2V0KGQucHJvcGVydGllcy5uZWlnaGJvcmhvKSkpXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICcjRkZGRkZGJylcbiAgICAgICAgICAgIC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIG5laWdoYm9yaG9vZCB3YXMgZmlsdGVyZWQgb3V0LCBkbyBub3RoaW5nXG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLmZpbHRlcmVkTmVpZ2hib3Job29kTWFwLmhhcyhkLnByb3BlcnRpZXMubmVpZ2hib3JobykpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgIC8vIERpc3BhdGNoIGEgaGlnaGxpZ2h0IGV2ZW50IGZvciB0aGlzIG5laWdoYm9yaG9vZFxuXG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkTmVpZ2hib3Job29kID0gIHNlbGYuZmlsdGVyZWROZWlnaGJvcmhvb2RNYXAuZ2V0KGQucHJvcGVydGllcy5uZWlnaGJvcmhvKVxuICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hOZWlnaGJvcmhvb2RIaWdobGlnaHQoc2VsZWN0ZWROZWlnaGJvcmhvb2QsdHJ1ZSk7XG5cbiAgXG4gICAgICAgICAgICAgICAgLy8gbGV0IHNlbCA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgICAgICAgICAvLyAvLyBTY2FsZSB1cCB0aGUgcGFydGljdWxhciBuZWlnaGJvcmhvb2QuIFxuICAgICAgICAgICAgICAgIC8vIHNlbC5tb3ZlVG9Gcm9udCgpO1xuXG4gICAgICAgICAgICAgICAgLy8gbGV0IGJveCA9IChzZWwubm9kZSgpIGFzIFNWR1BhdGhFbGVtZW50KS5nZXRCQm94KCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gLy8gRG8gc29tZSByZWFsbHkgbmFpdmUgY2xhbXBpbmcgdG8gZ2V0IGFscmVhZHkgbGFyZ2UgbmVpZ2hib3Job29kIHNsaWdodGx5IHNjYWxlZCxcbiAgICAgICAgICAgICAgICAvLyAvLyBhbmQgdGVlbnkgdGlueSBuZWlnaGJvcmhvb2RzIG1vcmUgaGlnaGx5IHNjYWxlZC4gVGhlIDI1MDAgZmlndXJlcyBmcm9tIGEgYm91bmRpbmdcbiAgICAgICAgICAgICAgICAvLyAvLyBib3ggb2YgYXBwcm94aW1hdGVseSA1MHg1MC4gU2NhbGUgZmFjdG9yIHJlbWFpbnMgaW4gcmFuZ2UgWzEuNSwgMi41XS5cbiAgICAgICAgICAgICAgICAvLyBsZXQgc2NhbGUgPSBNYXRoLm1pbigyLjUsIE1hdGgubWF4KDEuNSwgMjUwMCAvIChib3gud2lkdGggKiBib3guaGVpZ2h0KSkpO1xuICAgICAgICAgICAgICAgIC8vIGxldCBjeCA9IGJveC54ICsgYm94LndpZHRoLzI7XG4gICAgICAgICAgICAgICAgLy8gbGV0IGN5ID0gYm94LnkgKyBib3guaGVpZ2h0LzI7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8gc2VsLnRyYW5zaXRpb24oKVxuICAgICAgICAgICAgICAgIC8vICAgICAuc3R5bGUoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoLSR7KHNjYWxlIC0gMSkgKiBjeH1weCwgLSR7KHNjYWxlIC0gMSkgKiBjeX1weCkgc2NhbGUoJHtzY2FsZX0pYCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgbmVpZ2hib3Job29kIHdhcyBmaWx0ZXJlZCBvdXQsIGRvIG5vdGhpbmdcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuZmlsdGVyZWROZWlnaGJvcmhvb2RNYXAuaGFzKGQucHJvcGVydGllcy5uZWlnaGJvcmhvKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gRGlzcGF0Y2ggYW4gZW1wdHkgaGlnaGxpZ2h0IGV2ZW50XG4gICAgICAgICAgICAgICBsZXQgc2VsZWN0ZWROZWlnaGJvcmhvb2QgPSAgc2VsZi5maWx0ZXJlZE5laWdoYm9yaG9vZE1hcC5nZXQoZC5wcm9wZXJ0aWVzLm5laWdoYm9yaG8pXG4gICAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaE5laWdoYm9yaG9vZEhpZ2hsaWdodChzZWxlY3RlZE5laWdoYm9yaG9vZCxmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAvLyBsZXQgc2VsID0gZDMuc2VsZWN0KHRoaXMpO1xuICAgICAgICAgICAgICAgIC8vIHNlbC50cmFuc2l0aW9uKClcbiAgICAgICAgICAgICAgICAvLyAgICAgLnN0eWxlKCd0cmFuc2Zvcm0nLCBgdHJhbnNsYXRlKDBweCwgMHB4KSBzY2FsZSgxLjApYClcbiAgICAgICAgICAgICAgICAvLyAgICAgLm9uKCdlbmQnLCAoKSA9PiBzZWwubW92ZVRvQmFjaygpKTtcbiAgICAgICAgICAgIH0pLm9uKCdjbGljaycsIGZ1bmN0aW9uKGQpe1xuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgbmVpZ2hib3Job29kIHdhcyBmaWx0ZXJlZCBvdXQsIGRvIG5vdGhpbmdcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuZmlsdGVyZWROZWlnaGJvcmhvb2RNYXAuaGFzKGQucHJvcGVydGllcy5uZWlnaGJvcmhvKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBsZXQgc2VsZWN0ZWROZWlnaGJvcmhvb2QgPSAgc2VsZi5maWx0ZXJlZE5laWdoYm9yaG9vZE1hcC5nZXQoZC5wcm9wZXJ0aWVzLm5laWdoYm9yaG8pXG4gICAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaE5laWdoYm9yaG9vZFNlbGVjdGlvbihzZWxlY3RlZE5laWdoYm9yaG9vZCwgIWQzLmV2ZW50LnNoaWZ0S2V5KTtcblxuICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAvL2xhYmVsIGVhY2ggbmVpZ2hib3Job29kXG4gICAgICAgIC8vVE9ETzogdGlkeSBsYWJlbCB1cCBcbiAgICAgICAgbGV0IGxhYmVsU2VsZWN0aW9uID0gdGhpcy52aWV3LnBhdGhzQ29udGFpbmVyXG4gICAgICAgICAgLnNlbGVjdEFsbCgnZy5tYXAtbGFiZWwnKVxuICAgICAgICAgICAgLmRhdGEodGhpcy5kYXRhLmdlby5mZWF0dXJlcyk7XG4gICAgICAgIFxuICAgICAgICBsZXQgbGFiZWxFbnRlciA9IGxhYmVsU2VsZWN0aW9uLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdnJylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdtYXAtbGFiZWwnKVxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGQgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBbeCwgeV0gPSBwYXRoLmNlbnRyb2lkKGQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgdHJhbnNsYXRlKCR7eH0gJHt5IC0gMTJ9KWBcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgLmFwcGVuZCgndGV4dCcpXG4gICAgICAgICAgICAuYXR0cigneCcsIDApXG4gICAgICAgICAgICAuYXR0cigneScsIDApO1xuXG4gICAgICAgIGxhYmVsRW50ZXIuYXBwZW5kKCd0c3BhbicpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbWFwLWxhYmVsLW5hbWUnKVxuICAgICAgICAgICAgLmF0dHIoJ3gnLCAwKVxuICAgICAgICAgICAgLmF0dHIoJ2R5JywgJzEuMmVtJylcbiAgICAgICAgICAgIC50ZXh0KGQgPT4gZC5wcm9wZXJ0aWVzLm5laWdoYm9yaG8pO1xuXG4gICAgICAgIGxhYmVsRW50ZXIuYXBwZW5kKCd0c3BhbicpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbWFwLWxhYmVsLXByaWNlJylcbiAgICAgICAgICAgIC5hdHRyKCd4JywgMClcbiAgICAgICAgICAgIC5hdHRyKCdkeScsICcxLjJlbScpXG4gICAgICAgICAgICAudGV4dChkID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgbmVpZ2hib3Job29kID0gdGhpcy5kYXRhLm5laWdoYm9yaG9vZHMuZ2V0KGQucHJvcGVydGllcy5uZWlnaGJvcmhvKTsgIFxuICAgICAgICAgICAgICAgIGlmIChuZWlnaGJvcmhvb2Qpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52aWV3Lm1vbmV5Rm9ybWF0KEF0dHJpYnV0ZS5wcmljZS5uZWlnaGJvcmhvb2RBY2Nlc3NvcihuZWlnaGJvcmhvb2QpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAvLyBDcmVhdGUgdGhlIHVwZGF0ZSBzZWxlY3Rpb25cbiAgICAgICAgdGhpcy52aWV3LnBhdGhzID0gcGF0aHNFbnRlci5tZXJnZShwYXRoc1NlbGVjdGlvbik7XG4gICAgfVxufSAiLCJpbXBvcnQgKiBhcyBkMyBmcm9tICcuLi9kMyc7XG5cbmltcG9ydCB7IEJhc2VDb21wb25lbnQgfSBmcm9tICcuL2Jhc2UtY29tcG9uZW50JztcbmltcG9ydCB7IERpc3BhdGNoLCBEaXNwYXRjaEV2ZW50LCBMb2FkRXZlbnREYXRhLCBTZWxlY3RFdmVudERhdGEsIEhpZ2hsaWdodEV2ZW50RGF0YSwgRmlsdGVyRXZlbnREYXRhIH0gZnJvbSAnLi4vZGF0YS9kaXNwYXRjaCc7XG5pbXBvcnQgeyBMaXN0aW5nLCBOZWlnaGJvcmhvb2QgfSBmcm9tICcuLi9kYXRhL2xpc3RpbmcnO1xuaW1wb3J0IHsgQmxvY2sgfSBmcm9tICcuLi9kYXRhL2Jsb2NrJztcblxuZXhwb3J0IGNsYXNzIExpc3RpbmdCbG9ja3NDb21wb25lbnQgZXh0ZW5kcyBCYXNlQ29tcG9uZW50IHtcbiAgICBcbiAgICBwcml2YXRlIHZpZXc6IHtcbiAgICAgICAgc3ZnPzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgICAgIHByaWNlQmxvY2tHcm91cHM/OiBkMy5EYXRhU2VsZWN0aW9uPEJsb2NrPjtcbiAgICAgICAgbWFya3VwQmxvY2tHcm91cHM/OiBkMy5EYXRhU2VsZWN0aW9uPEJsb2NrPjtcblxuICAgICAgICBwcmljZUNvbG9yU2NhbGU/OiBkMy5TY2FsZUxpbmVhcjxzdHJpbmcsIHN0cmluZz47XG4gICAgICAgIG1hcmt1cENvbG9yU2NhbGU/OiBkMy5TY2FsZUxpbmVhcjxzdHJpbmcsIHN0cmluZz47XG4gICAgfVxuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHNlbGVjdG9yOiBzdHJpbmcsIGRpc3BhdGNoZXI6IERpc3BhdGNoKSB7XG4gICAgICAgIHN1cGVyKHNlbGVjdG9yLCBkaXNwYXRjaGVyKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIG91ciBjYW52YXNcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5lbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgICBsZXQgaGVpZ2h0ID0gdGhpcy5lbGVtZW50LmNsaWVudEhlaWdodDtcblxuICAgICAgICB0aGlzLnZpZXcgPSB7fTtcbiAgICAgICAgdGhpcy52aWV3LnN2ZyA9IGQzLnNlbGVjdCh0aGlzLnNlbGVjdG9yKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQnKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KTtcblxuICAgICAgICB0aGlzLnZpZXcucHJpY2VDb2xvclNjYWxlID0gZDMuc2NhbGVMaW5lYXI8c3RyaW5nPigpLnJhbmdlKFsnI2ZmZmZmZicsICcjMzg2ZmE0J10pO1xuICAgICAgICB0aGlzLnZpZXcubWFya3VwQ29sb3JTY2FsZSA9IGQzLnNjYWxlTGluZWFyPHN0cmluZz4oKS5yYW5nZShbJyNmZmZmZmYnLCAnIzM4NmZhNCddKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGludGVycG9sYXRlUmVkKHQ6IG51bWJlcikgOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gZDMuaHNsKDAuMCwgMS4wLCAxLjAgLSB0LzIpICsgJyc7XG4gICAgfVxuXG4gICAgcHVibGljIG9uTG9hZChkYXRhOiBMb2FkRXZlbnREYXRhKSB7XG4gICAgICAgIHN1cGVyLm9uTG9hZChkYXRhKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25TZWxlY3Qoc2VsZWN0aW9uOiBTZWxlY3RFdmVudERhdGEpIHtcbiAgICAgICAgc3VwZXIub25TZWxlY3Qoc2VsZWN0aW9uKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb2xvcnMoKTtcbiAgICAgICAgdGhpcy51cGRhdGVMaXN0aW5ncygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkhpZ2hsaWdodChoaWdobGlnaHQ6IEhpZ2hsaWdodEV2ZW50RGF0YSkge1xuICAgICAgICBzdXBlci5vbkhpZ2hsaWdodChoaWdobGlnaHQpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbG9ycygpO1xuICAgICAgICB0aGlzLnVwZGF0ZUxpc3RpbmdzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRmlsdGVyKGZpbHRlcjogRmlsdGVyRXZlbnREYXRhKSB7XG4gICAgICAgIHN1cGVyLm9uRmlsdGVyKGZpbHRlcik7XG4gICAgICAgIHRoaXMudXBkYXRlQ29sb3JzKCk7XG4gICAgICAgIHRoaXMudXBkYXRlTGlzdGluZ3MoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzaXplKCkge1xuXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc0Jsb2NrRW5hYmxlZChibG9jazogQmxvY2spIHtcbiAgICAgICAgaWYgKGJsb2NrLnR5cGUgPT09ICdwcmljZScgJiYgdGhpcy5maWx0ZXIucHJpY2VCbG9ja3MubGVuZ3RoICYmIHRoaXMuZmlsdGVyLnByaWNlQmxvY2tzLmluZGV4T2YoYmxvY2spID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGJsb2NrLnR5cGUgPT09ICdtYXJrdXAnICYmIHRoaXMuZmlsdGVyLm1hcmt1cEJsb2Nrcy5sZW5ndGggJiYgdGhpcy5maWx0ZXIubWFya3VwQmxvY2tzLmluZGV4T2YoYmxvY2spID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVMaXN0aW5ncygpIHtcbiAgICAgICAgLy8gSWYgYW55IHByaWNlIGJsb2NrcyBhcmUgc2VsZWN0ZWQsIGRyYXcgdGhvc2UgbGlzdGluZ3NcbiAgICAgICAgbGV0IHNlbGVjdGVkUHJpY2VCbG9ja3MgPSB0aGlzLnNlbGVjdGlvbi5wcmljZUJsb2NrcyB8fCBbXTtcbiAgICAgICAgbGV0IHNlbGVjdGVkTWFya3VwQmxvY2tzID0gdGhpcy5zZWxlY3Rpb24ubWFya3VwQmxvY2tzIHx8IFtdO1xuXG4gICAgICAgIGlmIChEaXNwYXRjaC5pc09ubHlMaXN0aW5nU2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKSAmJiB0aGlzLnNlbGVjdGlvbi5saXN0aW5ncy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIGxldCBsaXN0aW5nID0gdGhpcy5zZWxlY3Rpb24ubGlzdGluZ3NbMF07XG4gICAgICAgICAgICBzZWxlY3RlZFByaWNlQmxvY2tzID0gW2xpc3RpbmcucHJpY2VCbG9ja107XG4gICAgICAgICAgICBzZWxlY3RlZE1hcmt1cEJsb2NrcyA9IFtsaXN0aW5nLm1hcmt1cEJsb2NrXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChEaXNwYXRjaC5pc0VtcHR5U2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKSAmJiB0aGlzLmhpZ2hsaWdodC5saXN0aW5nKSB7XG4gICAgICAgICAgICBsZXQgbGlzdGluZyA9IHRoaXMuaGlnaGxpZ2h0Lmxpc3Rpbmc7XG4gICAgICAgICAgICBzZWxlY3RlZFByaWNlQmxvY2tzID0gW2xpc3RpbmcucHJpY2VCbG9ja107XG4gICAgICAgICAgICBzZWxlY3RlZE1hcmt1cEJsb2NrcyA9IFtsaXN0aW5nLm1hcmt1cEJsb2NrXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhbGxQcmljZUJsb2NrcyA9ICh0aGlzLmZpbHRlci5wcmljZUJsb2Nrcy5sZW5ndGgpID8gdGhpcy5maWx0ZXIucHJpY2VCbG9ja3MgOiB0aGlzLmRhdGEucHJpY2VCbG9ja3M7XG4gICAgICAgIGxldCBhbGxNYXJrdXBCbG9ja3MgPSAodGhpcy5maWx0ZXIubWFya3VwQmxvY2tzLmxlbmd0aCkgPyB0aGlzLmZpbHRlci5tYXJrdXBCbG9ja3MgOiB0aGlzLmRhdGEubWFya3VwQmxvY2tzO1xuXG4gICAgICAgIGlmIChzZWxlY3RlZFByaWNlQmxvY2tzLmxlbmd0aCAhPT0gMCB8fCBzZWxlY3RlZE1hcmt1cEJsb2Nrcy5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGJsb2NrIG9mIGFsbFByaWNlQmxvY2tzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkUHJpY2VCbG9ja3MuaW5kZXhPZihibG9jaykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0xpc3RpbmdzV2l0aGluQmxvY2soYmxvY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlTGlzdGluZ3NXaXRoaW5CbG9jayhibG9jayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBibG9jayBvZiBhbGxNYXJrdXBCbG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRNYXJrdXBCbG9ja3MuaW5kZXhPZihibG9jaykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0xpc3RpbmdzV2l0aGluQmxvY2soYmxvY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRlTGlzdGluZ3NXaXRoaW5CbG9jayhibG9jayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIC8vIElmIG9ubHkgYSBzaW5nbGUgbGlzdGluZyBpcyBzZWxlY3RlZCBvciBoaWdobGlnaHRlZCwgc2hvdyB0aGVtIGluZGl2aWR1YWxseSBpbiB0aGUgYmxvY2tzXG4gICAgICAgIC8vIGVsc2UgaWYgKHRoaXMuc2VsZWN0aW9uLmxpc3RpbmdzICYmIHRoaXMuc2VsZWN0aW9uLmxpc3RpbmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAvLyAgICAgbGV0IGxpc3RpbmcgPSB0aGlzLnNlbGVjdGlvbi5saXN0aW5nc1swXTtcbiAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpc3RpbmdzV2l0aGluQmxvY2sobGlzdGluZy5wcmljZUJsb2NrLCBsaXN0aW5nKTtcbiAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpc3RpbmdzV2l0aGluQmxvY2sobGlzdGluZy5tYXJrdXBCbG9jaywgbGlzdGluZyk7XG4gICAgICAgIC8vICAgICB0aGlzLmhpZGVMaXN0aW5nc1dpdGhpbkFsbE90aGVyQmxvY2tzKGxpc3RpbmcucHJpY2VCbG9jayk7XG4gICAgICAgIC8vICAgICB0aGlzLmhpZGVMaXN0aW5nc1dpdGhpbkFsbE90aGVyQmxvY2tzKGxpc3RpbmcubWFya3VwQmxvY2spO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGVsc2UgaWYgKHRoaXMuaGlnaGxpZ2h0Lmxpc3RpbmcpIHtcbiAgICAgICAgLy8gICAgIGxldCBsaXN0aW5nID0gdGhpcy5oaWdobGlnaHQubGlzdGluZztcbiAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpc3RpbmdzV2l0aGluQmxvY2sobGlzdGluZy5wcmljZUJsb2NrLCBsaXN0aW5nKTtcbiAgICAgICAgLy8gICAgIHRoaXMuZHJhd0xpc3RpbmdzV2l0aGluQmxvY2sobGlzdGluZy5tYXJrdXBCbG9jaywgbGlzdGluZyk7XG4gICAgICAgIC8vICAgICB0aGlzLmhpZGVMaXN0aW5nc1dpdGhpbkFsbE90aGVyQmxvY2tzKGxpc3RpbmcucHJpY2VCbG9jayk7XG4gICAgICAgIC8vICAgICB0aGlzLmhpZGVMaXN0aW5nc1dpdGhpbkFsbE90aGVyQmxvY2tzKGxpc3RpbmcubWFya3VwQmxvY2spO1xuICAgICAgICAvLyB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5oaWRlTGlzdGluZ3NXaXRoaW5BbGxCbG9ja3MoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlQ29sb3JzKCkge1xuICAgICAgICBsZXQgcHJpY2VDb3VudHMgPSBBcnJheTxudW1iZXI+KHRoaXMuZGF0YS5wcmljZUJsb2Nrcy5sZW5ndGgpLmZpbGwoMCk7XG4gICAgICAgIGxldCBtYXJrdXBDb3VudHMgPSBBcnJheTxudW1iZXI+KHRoaXMuZGF0YS5tYXJrdXBCbG9ja3MubGVuZ3RoKS5maWxsKDApO1xuXG4gICAgICAgIGxldCBkaXNwbGF5ZWRMaXN0aW5ncyA9IHRoaXMuYWxsU2VsZWN0ZWRMaXN0aW5ncztcblxuICAgICAgICBpZiAodGhpcy5hbGxTZWxlY3RlZExpc3RpbmdzLmxlbmd0aCA9PT0gMCAmJiBEaXNwYXRjaC5pc0VtcHR5U2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuaGlnaGxpZ2h0Lm5laWdoYm9yaG9vZClcbiAgICAgICAgICAgICAgICBkaXNwbGF5ZWRMaXN0aW5ncyA9IHRoaXMuaGlnaGxpZ2h0Lm5laWdoYm9yaG9vZC5saXN0aW5ncztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgY291bnRzIGZvciBvdXIgZ2l2ZW4gbGlzdGluZ3NcbiAgICAgICAgZm9yIChsZXQgbGlzdGluZyBvZiBkaXNwbGF5ZWRMaXN0aW5ncykge1xuICAgICAgICAgICAgcHJpY2VDb3VudHNbbGlzdGluZy5wcmljZUJsb2NrLm51bWJlcl0gKz0gMTtcbiAgICAgICAgICAgIG1hcmt1cENvdW50c1tsaXN0aW5nLm1hcmt1cEJsb2NrLm51bWJlcl0gKz0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgZmlsbCBjb2xvciBmdW5jdGlvblxuICAgICAgICBsZXQgYmxvY2tGaWxsID0gKGJsb2NrOiBCbG9jaykgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQmxvY2tFbmFibGVkKGJsb2NrKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAnZ3JleSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChkaXNwbGF5ZWRMaXN0aW5ncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3doaXRlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChibG9jay50eXBlID09PSAncHJpY2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbi5wcmljZUJsb2Nrcy5sZW5ndGggfHwgKERpc3BhdGNoLmlzT25seUxpc3RpbmdTZWxlY3Rpb24odGhpcy5zZWxlY3Rpb24pICYmIHRoaXMuc2VsZWN0aW9uLmxpc3RpbmdzLmxlbmd0aCA9PT0gMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnd2hpdGUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudmlldy5wcmljZUNvbG9yU2NhbGUocHJpY2VDb3VudHNbYmxvY2subnVtYmVyXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24ubWFya3VwQmxvY2tzLmxlbmd0aCB8fCAoRGlzcGF0Y2guaXNPbmx5TGlzdGluZ1NlbGVjdGlvbih0aGlzLnNlbGVjdGlvbikgJiYgdGhpcy5zZWxlY3Rpb24ubGlzdGluZ3MubGVuZ3RoID09PSAxKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICd3aGl0ZSc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52aWV3Lm1hcmt1cENvbG9yU2NhbGUobWFya3VwQ291bnRzW2Jsb2NrLm51bWJlcl0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGlnaGxpZ2h0IHRoZSBuZWlnaGJvcmhvb2RzIGluIHRoZSBibG9ja3NcbiAgICAgICAgdGhpcy52aWV3LnByaWNlQ29sb3JTY2FsZS5kb21haW4oZDMuZXh0ZW50KHByaWNlQ291bnRzKSk7XG4gICAgICAgIHRoaXMudmlldy5tYXJrdXBDb2xvclNjYWxlLmRvbWFpbihkMy5leHRlbnQobWFya3VwQ291bnRzKSk7XG5cbiAgICAgICAgdGhpcy52aWV3LnByaWNlQmxvY2tHcm91cHNcbiAgICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKVxuICAgICAgICAgICAgLnNlbGVjdCgncmVjdC5ibG9jay1yZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgYmxvY2tGaWxsKTtcblxuICAgICAgICB0aGlzLnZpZXcubWFya3VwQmxvY2tHcm91cHNcbiAgICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oNTAwKVxuICAgICAgICAgICAgLnNlbGVjdCgncmVjdC5ibG9jay1yZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgYmxvY2tGaWxsKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhpZGVMaXN0aW5nc1dpdGhpbkJsb2NrKGJsb2NrOiBCbG9jaykge1xuICAgICAgICBsZXQgYWxsR3JvdXBzID0gKGJsb2NrLnR5cGUgPT09ICdwcmljZScpID8gdGhpcy52aWV3LnByaWNlQmxvY2tHcm91cHMgOiB0aGlzLnZpZXcubWFya3VwQmxvY2tHcm91cHM7XG4gICAgICAgIGFsbEdyb3Vwcy5maWx0ZXIoZCA9PiBkLm51bWJlciA9PT0gYmxvY2subnVtYmVyKVxuICAgICAgICAgIC5zZWxlY3RBbGwoJ3JlY3QubGlzdGluZy1iYXInKVxuICAgICAgICAgICAgLmF0dHIoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKVxuICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oMjAwKVxuICAgICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwKVxuICAgIH1cblxuICAgIHByaXZhdGUgaGlkZUxpc3RpbmdzV2l0aGluQWxsT3RoZXJCbG9ja3MoYmxvY2s6IEJsb2NrKSB7XG4gICAgICAgIGxldCBhbGxCbG9ja3M6IEJsb2NrW107XG4gICAgICAgIFxuICAgICAgICBpZiAoYmxvY2sudHlwZSA9PT0gJ3ByaWNlJykge1xuICAgICAgICAgICAgYWxsQmxvY2tzID0gKHRoaXMuZmlsdGVyLnByaWNlQmxvY2tzLmxlbmd0aCkgPyB0aGlzLmZpbHRlci5wcmljZUJsb2NrcyA6IHRoaXMuZGF0YS5wcmljZUJsb2NrcztcbiAgICAgICAgfSBcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhbGxCbG9ja3MgPSAodGhpcy5maWx0ZXIubWFya3VwQmxvY2tzLmxlbmd0aCkgPyB0aGlzLmZpbHRlci5tYXJrdXBCbG9ja3MgOiB0aGlzLmRhdGEubWFya3VwQmxvY2tzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IgKGxldCBvdGhlciBvZiBhbGxCbG9ja3MpIHtcbiAgICAgICAgICAgIGlmIChibG9jayAhPT0gb3RoZXIpXG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlTGlzdGluZ3NXaXRoaW5CbG9jayhvdGhlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGhpZGVMaXN0aW5nc1dpdGhpbkFsbEJsb2NrcygpIHtcbiAgICAgICAgbGV0IHByaWNlQmxvY2tzID0gKHRoaXMuZmlsdGVyLnByaWNlQmxvY2tzLmxlbmd0aCkgPyB0aGlzLmZpbHRlci5wcmljZUJsb2NrcyA6IHRoaXMuZGF0YS5wcmljZUJsb2NrcztcbiAgICAgICAgbGV0IG1hcmt1cEJsb2NrcyA9ICh0aGlzLmZpbHRlci5tYXJrdXBCbG9ja3MubGVuZ3RoKSA/IHRoaXMuZmlsdGVyLm1hcmt1cEJsb2NrcyA6IHRoaXMuZGF0YS5tYXJrdXBCbG9ja3M7XG5cbiAgICAgICAgZm9yIChsZXQgYmxvY2sgb2YgcHJpY2VCbG9ja3MpXG4gICAgICAgICAgICB0aGlzLmhpZGVMaXN0aW5nc1dpdGhpbkJsb2NrKGJsb2NrKTtcblxuICAgICAgICBmb3IgKGxldCBibG9jayBvZiBtYXJrdXBCbG9ja3MpIFxuICAgICAgICAgICAgdGhpcy5oaWRlTGlzdGluZ3NXaXRoaW5CbG9jayhibG9jayk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkcmF3TGlzdGluZ3NXaXRoaW5CbG9jayhibG9jazogQmxvY2ssIGhpZ2hsaWdodGVkTGlzdGluZz86IExpc3RpbmcpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQmxvY2tFbmFibGVkKGJsb2NrKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICBsZXQgdGhpc0dyb3VwcyA9IChibG9jay50eXBlID09PSAncHJpY2UnKSA/IHRoaXMudmlldy5wcmljZUJsb2NrR3JvdXBzIDogdGhpcy52aWV3Lm1hcmt1cEJsb2NrR3JvdXBzO1xuICAgICAgICBsZXQgb3RoZXJHcm91cHMgPSAoYmxvY2sudHlwZSA9PT0gJ3ByaWNlJykgPyB0aGlzLnZpZXcubWFya3VwQmxvY2tHcm91cHMgOiB0aGlzLnZpZXcucHJpY2VCbG9ja0dyb3VwcztcblxuICAgICAgICBsZXQgdGhpc0tleSA9IChibG9jay50eXBlID09PSAncHJpY2UnKSA/ICdwcmljZUJsb2NrJyA6ICdtYXJrdXBCbG9jayc7XG4gICAgICAgIGxldCBvdGhlckJsb2NrS2V5ID0gKGJsb2NrLnR5cGUgPT09ICdwcmljZScpID8gJ21hcmt1cEJsb2NrJyA6ICdwcmljZUJsb2NrJztcblxuICAgICAgICBsZXQgYmxvY2tHcm91cCA9IHRoaXNHcm91cHMuZmlsdGVyKGQgPT4gZC5udW1iZXIgPT09IGJsb2NrLm51bWJlcik7XG4gICAgICAgIGxldCBibG9ja1JlY3QgPSBibG9ja0dyb3VwLnNlbGVjdCgncmVjdC5ibG9jay1yZWN0Jyk7XG5cbiAgICAgICAgbGV0IGhlaWdodCA9IHBhcnNlRmxvYXQoYmxvY2tSZWN0LmF0dHIoJ2hlaWdodCcpKTtcbiAgICAgICAgbGV0IHdpZHRoID0gcGFyc2VGbG9hdChibG9ja1JlY3QuYXR0cignd2lkdGgnKSk7XG4gICAgICAgIGxldCB4ID0gcGFyc2VGbG9hdChibG9ja1JlY3QuYXR0cigneCcpKTtcbiAgICAgICAgbGV0IHkgPSBwYXJzZUZsb2F0KGJsb2NrUmVjdC5hdHRyKCd5JykpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgaGVpZ2h0IHNjYWxlIGZvciB0aGlzIGJsb2NrXG4gICAgICAgIGxldCBtaW5pbXVtID0gYmxvY2subWluaW11bTtcbiAgICAgICAgbGV0IG1heGltdW0gPSBpc05hTihibG9jay5tYXhpbXVtKSA/IGQzLm1heChibG9jay5saXN0aW5ncywgbCA9PiBCbG9jay52YWx1ZShibG9jaywgbCkpIDogYmxvY2subWF4aW11bTtcbiAgICAgICAgbGV0IHNjYWxlSGVpZ2h0ID0gZDMuc2NhbGVMaW5lYXIoKVxuICAgICAgICAgICAgLmRvbWFpbihbbWluaW11bSwgbWF4aW11bV0pXG4gICAgICAgICAgICAucmFuZ2UoW2hlaWdodCAqIDAuMSwgaGVpZ2h0XSk7XG4gICAgICAgIGxldCBiYXJXaWR0aCA9IHdpZHRoIC8gYmxvY2subGlzdGluZ3MubGVuZ3RoO1xuXG4gICAgICAgIGxldCBiYXJGaWxsID0gKGxpc3Rpbmc6IExpc3RpbmcsIGhpZ2hsaWdodDogTGlzdGluZykgPT4ge1xuICAgICAgICAgICAgLy8gSWYgdGhlIGxpc3Rpbmcgd2FzIGZpbHRlcmVkIG91dCwgc2hvdyBub3RoaW5nXG4gICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJlZExpc3RpbmdzLmluZGV4T2YobGlzdGluZykgPT09IC0xKVxuICAgICAgICAgICAgICAgIHJldHVybiAnd2hpdGUnO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJZiB0aGUgbGlzdGluZyBpcyBvbmx5IHNpbmdsZSBsaXN0aW5nIHNlbGVjdGVkXG4gICAgICAgICAgICBpZiAoRGlzcGF0Y2guaXNPbmx5TGlzdGluZ1NlbGVjdGlvbih0aGlzLnNlbGVjdGlvbikgJiYgdGhpcy5zZWxlY3Rpb24ubGlzdGluZ3MubGVuZ3RoID09PSAxICYmIHRoaXMuc2VsZWN0aW9uLmxpc3RpbmdzWzBdID09PSBsaXN0aW5nKVxuICAgICAgICAgICAgICAgIHJldHVybiAncmVkJztcblxuICAgICAgICAgICAgLy8gSWYgbm90aGluZyBpcyBzZWxlY3RlZCBhbmQgdGhpcyBsaXN0aW5nIGlzIGhpZ2hsaWdodGVkXG4gICAgICAgICAgICBpZiAoRGlzcGF0Y2guaXNFbXB0eVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbikgJiYgdGhpcy5oaWdobGlnaHQubGlzdGluZyA9PT0gbGlzdGluZylcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3JlZCc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIElmIHRoZSBsaXN0aW5nIGlzIGhpZ2hsaWdodGVkXG4gICAgICAgICAgICBpZiAobGlzdGluZyA9PT0gaGlnaGxpZ2h0KVxuICAgICAgICAgICAgICAgIHJldHVybiAncmVkJztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiAnI2NjYyc7XG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGRlYm91bmNlZFVwZGF0ZUNvbG9yID0gKCgpID0+IHtcbiAgICAgICAgICAgIGxldCB0aW1lb3V0ID0gMDtcbiAgICAgICAgICAgIGxldCB3YWl0ID0gMTAwO1xuICAgICAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oY2FuY2VsID0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWNhbmNlbClcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gc2VsZi51cGRhdGVDb2xvcnMoKSwgd2FpdCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KSgpO1xuXG4gICAgICAgIGxldCBsaXN0aW5nQmFyc1NlbGVjdGlvbiA9IGJsb2NrR3JvdXBcbiAgICAgICAgICAuc2VsZWN0QWxsKCdyZWN0Lmxpc3RpbmctYmFyJylcbiAgICAgICAgICAgIC5kYXRhKGJsb2NrLmxpc3RpbmdzKTtcbiAgICAgICAgXG4gICAgICAgIGxldCBsaXN0aW5nQmFyc0VudGVyID0gbGlzdGluZ0JhcnNTZWxlY3Rpb24uZW50ZXIoKVxuICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2xpc3RpbmctYmFyJylcbiAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgZCA9PiBiYXJGaWxsKGQsIGhpZ2hsaWdodGVkTGlzdGluZykpXG4gICAgICAgICAgICAuYXR0cignd2lkdGgnLCBiYXJXaWR0aClcbiAgICAgICAgICAgIC5hdHRyKCd4JywgKGQsaSkgPT4gaSAqIGJhcldpZHRoKVxuICAgICAgICAgICAgLmF0dHIoJ2hlaWdodCcsIGQgPT4gc2NhbGVIZWlnaHQoQmxvY2sudmFsdWUoYmxvY2ssIGQpKSlcbiAgICAgICAgICAgIC5hdHRyKCd5JywgZCA9PiB5ICsgKGhlaWdodCAtIHNjYWxlSGVpZ2h0KEJsb2NrLnZhbHVlKGJsb2NrLCBkKSkpKVxuICAgICAgICAgICAgLm9uKCdtb3VzZWVudGVyJywgbCA9PiB7XG4gICAgICAgICAgICAgICAgLy8gRGlzcGF0Y2ggYSBsaXN0aW5nIGhpZ2hsaWdodFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZpbHRlcmVkTGlzdGluZ3MuaW5kZXhPZihsKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgb3RoZXJHcm91cHMuc2VsZWN0QWxsKCdyZWN0Lmxpc3RpbmctYmFyJykuYXR0cignZmlsbCcsIChkOkxpc3RpbmcpID0+IGJhckZpbGwoZCwgbCkpOyBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3TGlzdGluZ3NXaXRoaW5CbG9jayhsW290aGVyQmxvY2tLZXldLCBsKTtcbiAgICAgICAgICAgICAgICAgICAgZGVib3VuY2VkVXBkYXRlQ29sb3IodHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpc0dyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihkID0+IHRoaXMuaXNCbG9ja0VuYWJsZWQoZCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2VsZWN0QWxsKCdyZWN0Lmxpc3RpbmctYmFyJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgKGQ6TGlzdGluZykgPT4gYmFyRmlsbChkLCBsKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgb3RoZXJHcm91cHNcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZCA9PiB0aGlzLmlzQmxvY2tFbmFibGVkKGQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnNlbGVjdEFsbCgncmVjdC5ibG9jay1yZWN0JylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5hdHRyKCdmaWxsJywgJ3doaXRlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignbW91c2VsZWF2ZScsIGwgPT4ge1xuICAgICAgICAgICAgICAgIC8vIERpc3BhdGNoIGEgbGlzdGluZyB1bi1oaWdobGlnaHRcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJlZExpc3RpbmdzLmluZGV4T2YobCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNHcm91cHNcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZCA9PiB0aGlzLmlzQmxvY2tFbmFibGVkKGQpKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnNlbGVjdEFsbCgncmVjdC5saXN0aW5nLWJhcicpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cignZmlsbCcsIChkOkxpc3RpbmcpID0+IGJhckZpbGwoZCwgdW5kZWZpbmVkKSk7IFxuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZUxpc3RpbmdzV2l0aGluQmxvY2sobFtvdGhlckJsb2NrS2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIGRlYm91bmNlZFVwZGF0ZUNvbG9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBsID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5maWx0ZXJlZExpc3RpbmdzLmluZGV4T2YobCkgIT09IC0xKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoTGlzdGluZ1NlbGVjdGlvbihsLCAhZDMuZXZlbnQuc2hpZnRLZXkpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGxpc3RpbmdCYXJzVXBkYXRlID0gbGlzdGluZ0JhcnNTZWxlY3Rpb24ubWVyZ2UobGlzdGluZ0JhcnNFbnRlcik7XG4gICAgICAgIGxpc3RpbmdCYXJzVXBkYXRlXG4gICAgICAgICAgICAuYXR0cigncG9pbnRlci1ldmVudHMnLCAnYXV0bycpXG4gICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbigyMDApXG4gICAgICAgICAgICAuYXR0cignb3BhY2l0eScsIDEpXG4gICAgICAgICAgICAuYXR0cignZmlsbCcsIGQgPT4gYmFyRmlsbChkLCBoaWdobGlnaHRlZExpc3RpbmcpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHBhZGRpbmcgPSA1O1xuICAgICAgICBsZXQgc2VjdGlvbkxhYmVsV2lkdGggPSA1MDtcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5lbGVtZW50LmNsaWVudFdpZHRoIC0gc2VjdGlvbkxhYmVsV2lkdGg7XG4gICAgICAgIGxldCBoZWlnaHQgPSB0aGlzLmVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuXG4gICAgICAgIGxldCBwcmljZUJsb2NrU2VjdGlvbkxhYmVsID0gdGhpcy52aWV3LnN2Zy5zZWxlY3QoJ3RleHQucHJpY2UtYmxvY2stbGFiZWwnKTtcbiAgICAgICAgaWYgKHByaWNlQmxvY2tTZWN0aW9uTGFiZWwuZW1wdHkoKSkge1xuICAgICAgICAgICAgcHJpY2VCbG9ja1NlY3Rpb25MYWJlbCA9IHRoaXMudmlldy5zdmcuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAncHJpY2UtYmxvY2stbGFiZWwnKVxuICAgICAgICAgICAgICAgIC5zdHlsZSgnZm9udC1zaXplJywgJzEwcHgnKTtcblxuICAgICAgICAgICAgcHJpY2VCbG9ja1NlY3Rpb25MYWJlbC5hcHBlbmQoJ3RzcGFuJylcbiAgICAgICAgICAgICAgICAuYXR0cigneCcsIHBhZGRpbmcpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2R5JywgJy0xZW0nKVxuICAgICAgICAgICAgICAgIC50ZXh0KCdBaXJibmInKTtcblxuICAgICAgICAgICAgcHJpY2VCbG9ja1NlY3Rpb25MYWJlbC5hcHBlbmQoJ3RzcGFuJylcbiAgICAgICAgICAgICAgICAuYXR0cigneCcsIHBhZGRpbmcpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2R5JywgJzFlbScpXG4gICAgICAgICAgICAgICAgLnRleHQoJ1ByaWNlOicpO1xuICAgICAgICB9XG4gICAgICAgIHByaWNlQmxvY2tTZWN0aW9uTGFiZWxcbiAgICAgICAgICAgIC5hdHRyKCd4JywgcGFkZGluZylcbiAgICAgICAgICAgIC5hdHRyKCd5JywgaGVpZ2h0LzYgKyBoZWlnaHQvNik7XG5cbiAgICAgICAgbGV0IG1hcmt1cEJsb2NrU2VjdGlvbkxhYmVsID0gdGhpcy52aWV3LnN2Zy5zZWxlY3QoJ3RleHQubWFya3VwLWJsb2NrLWxhYmVsJyk7XG4gICAgICAgIGlmIChtYXJrdXBCbG9ja1NlY3Rpb25MYWJlbC5lbXB0eSgpKSB7XG4gICAgICAgICAgICBtYXJrdXBCbG9ja1NlY3Rpb25MYWJlbCA9IHRoaXMudmlldy5zdmcuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbWFya3VwLWJsb2NrLWxhYmVsJylcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsICcxMHB4JylcbiAgICAgICAgICAgICAgICAudGV4dCgnTWFya3VwOicpO1xuICAgICAgICB9XG4gICAgICAgIG1hcmt1cEJsb2NrU2VjdGlvbkxhYmVsXG4gICAgICAgICAgICAuYXR0cigneCcsIHBhZGRpbmcpXG4gICAgICAgICAgICAuYXR0cigneScsIGhlaWdodC8yICsgaGVpZ2h0LzYgKyBwYWRkaW5nKTtcblxuICAgICAgICBsZXQgYmxvY2tIZWlnaHQgPSBoZWlnaHQgLyAzO1xuICAgICAgICBsZXQgYmxvY2tXaWR0aCA9IChibG9jazogQmxvY2spID0+IHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLm1heCh3aWR0aCAqIGJsb2NrLmxpc3RpbmdzLmxlbmd0aCAvIHRoaXMuZGF0YS5saXN0aW5ncy5zaXplIC0gcGFkZGluZywgMSk7XG4gICAgICAgIH07XG4gICAgICAgIGxldCBibG9ja1ggPSAoYmxvY2s6IEJsb2NrKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gc2VjdGlvbkxhYmVsV2lkdGggKyBwYWRkaW5nICsgd2lkdGggKiBibG9jay5saXN0aW5nc1N0YXJ0SW5kZXggLyB0aGlzLmRhdGEubGlzdGluZ3Muc2l6ZTtcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGJsb2NrTGFiZWwgPSAoYmxvY2s6IEJsb2NrKSA9PiB7XG4gICAgICAgICAgICBsZXQgbGFiZWwgPSBibG9jay5taW5pbXVtLnRvRml4ZWQoMCk7XG4gICAgICAgICAgICBpZiAoaXNOYU4oYmxvY2subWF4aW11bSkpXG4gICAgICAgICAgICAgICAgbGFiZWwgKz0gJysnO1xuXG4gICAgICAgICAgICBpZiAoYmxvY2sudHlwZSA9PT0gJ3ByaWNlJykge1xuICAgICAgICAgICAgICAgIGxhYmVsID0gJyQnICsgbGFiZWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsYWJlbCArPSAnJSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBsYWJlbDtcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgcHJpY2VCbG9ja3NTZWxlY3Rpb24gPSB0aGlzLnZpZXcuc3ZnXG4gICAgICAgICAgLnNlbGVjdEFsbCgnZy5wcmljZS1ibG9jaycpXG4gICAgICAgICAgICAuZGF0YSh0aGlzLmRhdGEucHJpY2VCbG9ja3MpO1xuXG4gICAgICAgIGxldCBwcmljZUJsb2Nrc0VudGVyID0gcHJpY2VCbG9ja3NTZWxlY3Rpb24uZW50ZXIoKS5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdwcmljZS1ibG9jaycpO1xuICAgICAgICBwcmljZUJsb2Nrc0VudGVyLmFwcGVuZCgndGV4dCcpLmF0dHIoJ2NsYXNzJywgJ2Jsb2NrLWxhYmVsJyk7XG4gICAgICAgIHByaWNlQmxvY2tzRW50ZXJcbiAgICAgICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdibG9jay1yZWN0JylcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0Jsb2NrRW5hYmxlZChkKSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEJsb2NrU2VsZWN0aW9uKGQsICFkMy5ldmVudC5zaGlmdEtleSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudmlldy5wcmljZUJsb2NrR3JvdXBzID0gcHJpY2VCbG9ja3NTZWxlY3Rpb24ubWVyZ2UocHJpY2VCbG9ja3NFbnRlcik7XG4gICAgICAgIHRoaXMudmlldy5wcmljZUJsb2NrR3JvdXBzLnN0eWxlKCd0cmFuc2Zvcm0nLCBkID0+IGB0cmFuc2xhdGUoJHtibG9ja1goZCl9cHgsICR7LXBhZGRpbmd9cHgpYCk7XG4gICAgICAgIHRoaXMudmlldy5wcmljZUJsb2NrR3JvdXBzXG4gICAgICAgICAgLnNlbGVjdCgncmVjdC5ibG9jay1yZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBibG9ja0hlaWdodClcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGJsb2NrV2lkdGgpXG4gICAgICAgICAgICAuYXR0cigneScsIGhlaWdodC82KVxuICAgICAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgICAgICAgICAgLnN0eWxlKCdzdHJva2UnLCAnIzg4OCcpXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsIDEpO1xuICAgICAgICB0aGlzLnZpZXcucHJpY2VCbG9ja0dyb3Vwc1xuICAgICAgICAgIC5zZWxlY3QoJ3RleHQuYmxvY2stbGFiZWwnKVxuICAgICAgICAgICAgLmF0dHIoJ3gnLCBkID0+IGJsb2NrV2lkdGgoZCkgLyAyKVxuICAgICAgICAgICAgLmF0dHIoJ3knLCBoZWlnaHQvMTIgKyBoZWlnaHQvMjQpXG4gICAgICAgICAgICAudGV4dChibG9ja0xhYmVsKVxuICAgICAgICAgICAgLnN0eWxlKCd0ZXh0LWFuY2hvcicsICdtaWRkbGUnKVxuICAgICAgICAgICAgLnN0eWxlKCdmb250LXNpemUnLCAnMTBweCcpO1xuXG5cbiAgICAgICAgbGV0IG1hcmt1cEJsb2Nrc1NlbGVjdGlvbiA9IHRoaXMudmlldy5zdmdcbiAgICAgICAgICAuc2VsZWN0QWxsKCdnLm1hcmt1cC1ibG9jaycpXG4gICAgICAgICAgICAuZGF0YSh0aGlzLmRhdGEubWFya3VwQmxvY2tzKTtcblxuICAgICAgICBsZXQgbWFya3VwQmxvY2tzRW50ZXIgPSBtYXJrdXBCbG9ja3NTZWxlY3Rpb24uZW50ZXIoKS5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdtYXJrdXAtYmxvY2snKTtcbiAgICAgICAgbWFya3VwQmxvY2tzRW50ZXIuYXBwZW5kKCd0ZXh0JykuYXR0cignY2xhc3MnLCAnYmxvY2stbGFiZWwnKTtcbiAgICAgICAgbWFya3VwQmxvY2tzRW50ZXIuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdibG9jay1yZWN0JylcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0Jsb2NrRW5hYmxlZChkKSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEJsb2NrU2VsZWN0aW9uKGQsICFkMy5ldmVudC5zaGlmdEtleSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudmlldy5tYXJrdXBCbG9ja0dyb3VwcyA9IG1hcmt1cEJsb2Nrc1NlbGVjdGlvbi5tZXJnZShtYXJrdXBCbG9ja3NFbnRlcik7XG4gICAgICAgIHRoaXMudmlldy5tYXJrdXBCbG9ja0dyb3Vwcy5zdHlsZSgndHJhbnNmb3JtJywgZCA9PiBgdHJhbnNsYXRlKCR7YmxvY2tYKGQpfXB4LCAke3BhZGRpbmcgKyBoZWlnaHQvMn1weClgKTtcbiAgICAgICAgdGhpcy52aWV3Lm1hcmt1cEJsb2NrR3JvdXBzXG4gICAgICAgICAgLnNlbGVjdCgncmVjdC5ibG9jay1yZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBibG9ja0hlaWdodClcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGJsb2NrV2lkdGgpXG4gICAgICAgICAgICAuYXR0cigneScsIDApXG4gICAgICAgICAgICAuYXR0cignZmlsbCcsICd3aGl0ZScpXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICcjODg4JylcbiAgICAgICAgICAgIC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgMSk7XG4gICAgICAgIHRoaXMudmlldy5tYXJrdXBCbG9ja0dyb3Vwc1xuICAgICAgICAgIC5zZWxlY3QoJ3RleHQuYmxvY2stbGFiZWwnKVxuICAgICAgICAgICAgLmF0dHIoJ3gnLCBkID0+IGJsb2NrV2lkdGgoZCkgLyAyKVxuICAgICAgICAgICAgLmF0dHIoJ3knLCBoZWlnaHQvMiAtIGhlaWdodC8xMilcbiAgICAgICAgICAgIC50ZXh0KGJsb2NrTGFiZWwpXG4gICAgICAgICAgICAuc3R5bGUoJ3RleHQtYW5jaG9yJywgJ21pZGRsZScpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZvbnQtc2l6ZScsICcxMHB4Jyk7XG4gICAgfVxufSAiLCJpbXBvcnQgKiBhcyBkMyBmcm9tICcuLi9kMyc7XG5cbmltcG9ydCB7IEJhc2VDb21wb25lbnQgfSBmcm9tICcuL2Jhc2UtY29tcG9uZW50JztcbmltcG9ydCB7IERpc3BhdGNoLCBEaXNwYXRjaEV2ZW50LCBMb2FkRXZlbnREYXRhLCBTZWxlY3RFdmVudERhdGEsIEhpZ2hsaWdodEV2ZW50RGF0YSwgRmlsdGVyRXZlbnREYXRhIH0gZnJvbSAnLi4vZGF0YS9kaXNwYXRjaCc7XG5pbXBvcnQgeyBMaXN0aW5nLCBOZWlnaGJvcmhvb2QgfSBmcm9tICcuLi9kYXRhL2xpc3RpbmcnO1xuaW1wb3J0IHsgQXR0cmlidXRlIH0gZnJvbSAnLi4vZGF0YS9hdHRyaWJ1dGUnO1xuXG5leHBvcnQgY2xhc3MgU2NhdHRlclBsb3RDb21wb25lbnQgZXh0ZW5kcyBCYXNlQ29tcG9uZW50IHtcbiAgICBcbiAgICBwcml2YXRlIGF0dHJpYnV0ZU1hcDogQXR0cmlidXRlW107XG4gICAgcHJpdmF0ZSBzZWxlY3RlZEF0dHJpYnV0ZTogQXR0cmlidXRlO1xuICAgIHByaXZhdGUgc2VsZWN0ZWRMZXZlbDogJ05laWdoYm9yaG9vZHMnIHwgJ0xpc3RpbmdzJztcbiAgICBwcml2YXRlIHF1YWRyYW50TmFtZXM6IFtzdHJpbmcsIHN0cmluZywgc3RyaW5nLCBzdHJpbmddO1xuXG4gICAgcHJpdmF0ZSB2aWV3OiB7XG4gICAgICAgIHRpdGxlPzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgICAgIG92ZXJsYXk/OiBkMy5EYXRhbGVzc1NlbGVjdGlvbjtcbiAgICAgICAgc3ZnPzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgICAgIHBhZGRpbmc/OiBkMy5QYWRkaW5nO1xuICAgICAgICBcbiAgICAgICAgbWFya3VwU2NhbGU/OiBkMy5TY2FsZUxpbmVhcjxudW1iZXIsIG51bWJlcj47XG4gICAgICAgIG90aGVyU2NhbGU/OiBkMy5HZW5lcmljU2NhbGU8YW55LCBhbnk+OyAvL2QzLlNjYWxlTGluZWFyPG51bWJlciwgbnVtYmVyPiB8IGQzLlNjYWxlUG9pbnQ8c3RyaW5nPjtcbiAgICAgICAgc2l6ZVNjYWxlPzogZDMuU2NhbGVMaW5lYXI8bnVtYmVyLCBudW1iZXI+O1xuXG4gICAgICAgIHF1YWRyYW50TGluZUhvcml6b250YWw/OiBkMy5EYXRhbGVzc1NlbGVjdGlvbjtcbiAgICAgICAgcXVhZHJhbnRMaW5lVmVydGljYWw/OiBkMy5EYXRhbGVzc1NlbGVjdGlvbjtcbiAgICAgICAgcXVhZHJhbnRMYWJlbHM/OiBkMy5EYXRhU2VsZWN0aW9uPHN0cmluZz47XG5cbiAgICAgICAgZHJhZ0FyZWE/OiBkMy5EYXRhbGVzc1NlbGVjdGlvbjtcbiAgICAgICAgem9vbT86IGQzLlpvb21CZWhhdmlvcjxFbGVtZW50LCB7fT47XG5cbiAgICAgICAgY2lyY2xlc0NvbnRhaW5lckdyb3VwPzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgICAgIGNpcmNsZXNDb250YWluZXJSb290PzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgICAgIGNpcmNsZXNDb250YWluZXJJbm5lcj86IGQzLkRhdGFsZXNzU2VsZWN0aW9uO1xuICAgICAgICBuZWlnaGJvcmhvb2RDaXJjbGVzPzogZDMuRGF0YVNlbGVjdGlvbjxOZWlnaGJvcmhvb2Q+O1xuICAgICAgICBsaXN0aW5nQ2lyY2xlcz86IGQzLkRhdGFTZWxlY3Rpb248TGlzdGluZz47XG4gICAgfVxuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHNlbGVjdG9yOiBzdHJpbmcsIGRpc3BhdGNoZXI6IERpc3BhdGNoKSB7XG4gICAgICAgIHN1cGVyKHNlbGVjdG9yLCBkaXNwYXRjaGVyKTtcblxuICAgICAgICAvLyBJbml0aWFsaXplIG91ciBjYW52YXNcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5lbGVtZW50LmNsaWVudFdpZHRoO1xuICAgICAgICBsZXQgaGVpZ2h0ID0gdGhpcy5lbGVtZW50LmNsaWVudEhlaWdodDtcblxuICAgICAgICB0aGlzLnZpZXcgPSB7fTtcbiAgICAgICAgdGhpcy52aWV3LnBhZGRpbmcgPSBuZXcgZDMuUGFkZGluZyg0MCk7XG5cbiAgICAgICAgdGhpcy52aWV3LnRpdGxlID0gZDMuc2VsZWN0KHRoaXMuZWxlbWVudC5wYXJlbnRFbGVtZW50KS5zZWxlY3QoJy50aXRsZSAudGV4dCcpO1xuICAgICAgICB0aGlzLnZpZXcub3ZlcmxheSA9IGQzLnNlbGVjdCh0aGlzLnNlbGVjdG9yKS5zZWxlY3QoJy5vdmVybGF5Jyk7XG4gICAgICAgIHRoaXMudmlldy5vdmVybGF5XG4gICAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICd0b3AtbGVmdCcpXG4gICAgICAgICAgICAuc3R5bGUoJ3RvcCcsICc1cHgnKTtcblxuICAgICAgICB0aGlzLnZpZXcub3ZlcmxheVxuICAgICAgICAgIC5zZWxlY3QoJ2Rpdi50b3AtbGVmdCcpXG4gICAgICAgICAgLmFwcGVuZCgnYnV0dG9uJylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdyZXNldC16b29tJylcbiAgICAgICAgICAgIC50ZXh0KCdSZXNldCBab29tJyk7XG5cbiAgICAgICAgdGhpcy52aWV3LnN2ZyA9IGQzLnNlbGVjdCh0aGlzLnNlbGVjdG9yKS5hcHBlbmQoJ3N2ZycpXG4gICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnY2hhcnQnKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgaGVpZ2h0KVxuICAgICAgICBcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAgPSBbXTtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAucHVzaChBdHRyaWJ1dGUucHJpY2UpO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcC5wdXNoKEF0dHJpYnV0ZS50cnVsaWFQcmljZSk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwLnB1c2goQXR0cmlidXRlLm1vbnRobHlQcmljZSk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwLnB1c2goQXR0cmlidXRlLnJhdGluZyk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwLnB1c2goQXR0cmlidXRlLmNhbmNlbGxhdGlvblBvbGljeSk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwLnB1c2goQXR0cmlidXRlLm51bWJlck9mUmV2aWV3cyk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwLnB1c2goQXR0cmlidXRlLm51bWJlck9mR3Vlc3RJbmNsdWRlZCk7XG4gICAgICAgIFxuXG4gICAgICAgIC8vIFNlbGVjdCB0aGUgZGVmYXVsdCBxdWFkcmFudCBuYW1lc1xuICAgICAgICB0aGlzLnF1YWRyYW50TmFtZXMgPSBbdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkXTtcblxuICAgICAgICAvLyBTZWxlY3QgdGhlIHJhdGluZyBhdHRyaWJ1dGUgYnkgZGVmYXVsdFxuICAgICAgICB0aGlzLnNlbGVjdGVkQXR0cmlidXRlID0gdGhpcy5hdHRyaWJ1dGVNYXBbMF07XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRMZXZlbCA9ICdOZWlnaGJvcmhvb2RzJztcbiAgICAgICAgdGhpcy51cGRhdGVUaXRsZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZVF1YWRyYW50cygpIHtcbiAgICAgICAgbGV0IHF1YWRyYW50c0FyZWEgPSB0aGlzLnZpZXcuc3ZnXG4gICAgICAgICAgICAuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAncXVhZHJhbnQtYXJlYScpO1xuXG4gICAgICAgIHRoaXMudmlldy5xdWFkcmFudExpbmVIb3Jpem9udGFsID0gcXVhZHJhbnRzQXJlYVxuICAgICAgICAgICAgLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ3F1YWRyYW50LWxpbmVzIHF1YWRyYW50LWhvcml6b250YWwnKVxuICAgICAgICAgICAgLmFwcGVuZCgnbGluZScpO1xuXG4gICAgICAgIHRoaXMudmlldy5xdWFkcmFudExpbmVWZXJ0aWNhbCA9IHF1YWRyYW50c0FyZWFcbiAgICAgICAgICAgIC5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdxdWFkcmFudC1saW5lcyBxdWFkcmFudC12ZXJ0aWNhbCcpXG4gICAgICAgICAgICAuYXBwZW5kKCdsaW5lJyk7XG5cbiAgICAgICAgbGV0IHF1YWRyYW50TGFiZWxzU2VsZWN0aW9uID0gcXVhZHJhbnRzQXJlYVxuICAgICAgICAgIC5hcHBlbmQoJ2cnKS5hdHRyKCdjbGFzcycsICdxdWFkcmFudC1sYWJlbHMnKVxuICAgICAgICAgIC5zZWxlY3RBbGwoJ3RleHQnKVxuICAgICAgICAgICAgLmRhdGEodGhpcy5xdWFkcmFudE5hbWVzKTtcbiAgICAgICAgbGV0IHF1YWRyYW50TGFiZWxzRW50ZXIgPSBxdWFkcmFudExhYmVsc1NlbGVjdGlvbi5lbnRlcigpXG4gICAgICAgICAgICAuYXBwZW5kKCd0ZXh0JylcbiAgICAgICAgICAgIC50ZXh0KGQgPT4gZCk7XG4gICAgICAgIHRoaXMudmlldy5xdWFkcmFudExhYmVscyA9IHF1YWRyYW50TGFiZWxzU2VsZWN0aW9uLm1lcmdlKHF1YWRyYW50TGFiZWxzRW50ZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZUF4ZXMoKSB7XG4gICAgICAgIC8vIENyZWF0ZSB0aGUgYXhpcyBlbGVtZW50c1xuICAgICAgICB0aGlzLnZpZXcuc3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ21hcmt1cC1heGlzJyk7XG4gICAgICAgIHRoaXMudmlldy5zdmcuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAnb3RoZXItYXhpcycpO1xuICAgICAgICB0aGlzLnZpZXcuc3ZnXG4gICAgICAgICAgICAuYXBwZW5kKCdnJykuYXR0cignY2xhc3MnLCAnYXhpcy1sYWJlbCBtYXJrdXAtYXhpcy1sYWJlbCcpXG4gICAgICAgICAgICAuYXBwZW5kKCd0ZXh0JykudGV4dCgnTWFya3VwIFBlcmNlbnRhZ2UnKS5zdHlsZSgndHJhbnNmb3JtJywgJ3JvdGF0ZSgtOTBkZWcpJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgbGV0IGF0dHJpYnV0ZVNlbGVjdCA9IHRoaXMudmlldy5vdmVybGF5XG4gICAgICAgICAgICAuYXBwZW5kKCdkaXYnKS5hdHRyKCdjbGFzcycsICdheGlzLWxhYmVsIG90aGVyLWF4aXMtbGFiZWwnKVxuICAgICAgICAgICAgLmFwcGVuZCgnc2VsZWN0Jyk7XG4gICAgICAgIFxuICAgICAgICBsZXQgYXR0cmlidXRlT3B0aW9uc1NlbGVjdGlvbiA9IGF0dHJpYnV0ZVNlbGVjdC5zZWxlY3RBbGwoJ29wdGlvbicpLmRhdGEodGhpcy5hdHRyaWJ1dGVNYXApO1xuICAgICAgICBsZXQgYXR0cmlidXRlT3B0aW9uc0VudGVyID0gYXR0cmlidXRlT3B0aW9uc1NlbGVjdGlvbi5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgnb3B0aW9uJylcbiAgICAgICAgICAgIC50ZXh0KGQgPT4gZC5uYW1lKVxuICAgICAgICAgICAgLmF0dHIoJ3NlbGVjdGVkJywgZCA9PiBkID09PSB0aGlzLnNlbGVjdGVkQXR0cmlidXRlID8gdHJ1ZSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIGxldCBhdHRyaWJ1dGVPcHRpb25zID0gYXR0cmlidXRlT3B0aW9uc1NlbGVjdGlvbi5tZXJnZShhdHRyaWJ1dGVPcHRpb25zRW50ZXIpO1xuXG4gICAgICAgIGF0dHJpYnV0ZVNlbGVjdC5vbignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgbGV0IGluZGV4OiBudW1iZXIgPSBhdHRyaWJ1dGVTZWxlY3QucHJvcGVydHkoJ3NlbGVjdGVkSW5kZXgnKTtcbiAgICAgICAgICAgIGxldCBhdHRyaWJ1dGU6IEF0dHJpYnV0ZSA9IGF0dHJpYnV0ZU9wdGlvbnMuZmlsdGVyKChkLGkpID0+IGkgPT0gaW5kZXgpLmRhdHVtKCk7XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc2NhbGVzIGZvciB0aGlzIGF0dHJpYnV0ZSBhbmQgcmUtcmVuZGVyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkQXR0cmlidXRlID0gYXR0cmlidXRlO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2FsZXMoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZUxldmVsU2VsZWN0KCkge1xuICAgICAgICBsZXQgbGV2ZWxTZWxlY3QgPSB0aGlzLnZpZXcub3ZlcmxheS5zZWxlY3QoJ2Rpdi50b3AtbGVmdCcpXG4gICAgICAgICAgLmFwcGVuZCgnc2VsZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdsZXZlbC1zZWxlY3QnKTtcbiAgICAgICAgICAgIFxuICAgICAgICBsZXQgbGV2ZWxPcHRpb25zU2VsZWN0aW9uID0gbGV2ZWxTZWxlY3Quc2VsZWN0QWxsKCdvcHRpb24nKS5kYXRhPCdOZWlnaGJvcmhvb2RzJ3wnTGlzdGluZ3MnPihbJ05laWdoYm9yaG9vZHMnLCAnTGlzdGluZ3MnXSk7XG4gICAgICAgIGxldCBsZXZlbE9wdGlvbnNFbnRlciA9IGxldmVsT3B0aW9uc1NlbGVjdGlvbi5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgnb3B0aW9uJylcbiAgICAgICAgICAgIC50ZXh0KGQgPT4gZClcbiAgICAgICAgICAgIC5hdHRyKCdzZWxlY3RlZCcsIGQgPT4gZCA9PT0gdGhpcy5zZWxlY3RlZExldmVsID8gdHJ1ZSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIGxldCBsZXZlbE9wdGlvbnMgPSBsZXZlbE9wdGlvbnNTZWxlY3Rpb24ubWVyZ2UobGV2ZWxPcHRpb25zRW50ZXIpO1xuXG4gICAgICAgIGxldmVsU2VsZWN0Lm9uKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgaW5kZXg6IG51bWJlciA9IGxldmVsU2VsZWN0LnByb3BlcnR5KCdzZWxlY3RlZEluZGV4Jyk7XG4gICAgICAgICAgICBsZXQgbGV2ZWwgPSBsZXZlbE9wdGlvbnMuZmlsdGVyKChkLGkpID0+IGkgPT09IGluZGV4KS5kYXR1bSgpO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZExldmVsID0gbGV2ZWw7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBcblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZURyYWcoKSB7XG4gICAgICAgIHRoaXMudmlldy5kcmFnQXJlYSA9IHRoaXMudmlldy5jaXJjbGVzQ29udGFpbmVyUm9vdDtcbiAgICAgICAgdGhpcy52aWV3LmRyYWdBcmVhXG4gICAgICAgICAgLnNlbGVjdCgncmVjdC5iYWNrZmlsbCcpXG4gICAgICAgICAgICAuY2FsbChcbiAgICAgICAgICAgICAgICBkMy5kcmFnKClcbiAgICAgICAgICAgICAgICAuZmlsdGVyKCgpID0+ICFldmVudFsnYWx0S2V5J10pXG4gICAgICAgICAgICAgICAgLnN1YmplY3QoKCkgPT4gW1tkMy5ldmVudC54LCBkMy5ldmVudC55XSwgW2QzLmV2ZW50LngsIGQzLmV2ZW50LnldXSlcbiAgICAgICAgICAgICAgICAub24oJ3N0YXJ0JywgKCkgPT4gdGhpcy5zZWxlY3Rpb25EcmFnU3RhcnRlZCgpKVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNlbGVjdGlvbkRyYWdTdGFydGVkKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBsaXN0IG9mIGRhdGEgcG9zaXRpb25zIG9mIHRoaXMgcGF0aFxuICAgICAgICBsZXQgZDogW251bWJlcixudW1iZXJdW10gPSBkMy5ldmVudC5zdWJqZWN0O1xuXG4gICAgICAgIC8vIEdldCB0aGUgZHJhZyBib3VuZGFyaWVzLCBhbmQgb2Zmc2V0c1xuICAgICAgICBsZXQgb2Zmc2V0WCA9ICt0aGlzLnZpZXcuZHJhZ0FyZWEuYXR0cignZGF0YS1vZmZzZXQteCcpO1xuICAgICAgICBsZXQgb2Zmc2V0WSA9ICt0aGlzLnZpZXcuZHJhZ0FyZWEuYXR0cignZGF0YS1vZmZzZXQteScpO1xuICAgICAgICBsZXQgd2lkdGggPSArdGhpcy52aWV3LmRyYWdBcmVhLnNlbGVjdCgncmVjdC5iYWNrZmlsbCcpLmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGxldCBoZWlnaHQgPSArdGhpcy52aWV3LmRyYWdBcmVhLnNlbGVjdCgncmVjdC5iYWNrZmlsbCcpLmF0dHIoJ2hlaWdodCcpXG4gICAgICAgIFxuICAgICAgICAvLyBHZXQgdGhlIGRyYWcgcG9zaXRpb25cbiAgICAgICAgbGV0IHgwOiBudW1iZXIgPSBNYXRoLm1heCgwLCBNYXRoLm1pbih3aWR0aCwgZDMuZXZlbnQueCkpO1xuICAgICAgICBsZXQgeTA6IG51bWJlciA9IE1hdGgubWF4KDAsIE1hdGgubWluKGhlaWdodCwgZDMuZXZlbnQueSkpO1xuICAgICAgICBsZXQgZGlkTW92ZSA9IGZhbHNlO1xuXG4gICAgICAgIGxldCByZWN0TGVmdCA9IDA7IFxuICAgICAgICBsZXQgcmVjdFRvcCA9IDA7IFxuICAgICAgICBsZXQgcmVjdFdpZHRoID0gMDsgXG4gICAgICAgIGxldCByZWN0SGVpZ2h0ID0gMDsgXG5cbiAgICAgICAgLy8gRGV0ZXJtaW5lIHdoZXRoZXIgdGhlIHJlc3VsdGluZyBzZWxlY3Rpb24gc2hvdWxkIGJlIG5ldyBvciBhcHBlbmRlZFxuICAgICAgICBsZXQgbmV3U2VsZWN0aW9uID0gIWQzLmV2ZW50LnNvdXJjZUV2ZW50LnNoaWZ0S2V5O1xuICAgICAgICBcbiAgICAgICAgbGV0IHJlY3QgPSB0aGlzLnZpZXcuZHJhZ0FyZWFcbiAgICAgICAgICAgIC5hcHBlbmQoJ3JlY3QnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2RyYWctc2VsZWN0aW9uJyk7XG5cbiAgICAgICAgZDMuZXZlbnRcbiAgICAgICAgLm9uKCdkcmFnJywgKCkgPT4ge1xuICAgICAgICAgICAgZGlkTW92ZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGxldCB4MTogbnVtYmVyID0gTWF0aC5tYXgoMCwgTWF0aC5taW4od2lkdGgsIGQzLmV2ZW50LngpKTtcbiAgICAgICAgICAgIGxldCB5MTogbnVtYmVyID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oaGVpZ2h0LCBkMy5ldmVudC55KSk7XG5cbiAgICAgICAgICAgIHJlY3RMZWZ0ID0gTWF0aC5taW4oeDAsIHgxKTtcbiAgICAgICAgICAgIHJlY3RUb3AgPSBNYXRoLm1pbih5MCwgeTEpO1xuICAgICAgICAgICAgcmVjdFdpZHRoID0gTWF0aC5hYnMoeDEgLSB4MCk7XG4gICAgICAgICAgICByZWN0SGVpZ2h0ID0gTWF0aC5hYnMoeTEgLSB5MCk7XG4gICAgICAgICAgICByZWN0LmF0dHIoJ3gnLCByZWN0TGVmdClcbiAgICAgICAgICAgICAgICAuYXR0cigneScsIHJlY3RUb3ApXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgcmVjdFdpZHRoKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCByZWN0SGVpZ2h0KTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWRpZE1vdmUpIHtcbiAgICAgICAgICAgICAgICByZWN0TGVmdCA9IHgwO1xuICAgICAgICAgICAgICAgIHJlY3RUb3AgPSB5MDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gU2VsZWN0IHRoZSBhY3R1YWwgZWxlbWVudHNcbiAgICAgICAgICAgIGxldCBzdmdOb2RlOiBTVkdTVkdFbGVtZW50ID0gPFNWR1NWR0VsZW1lbnQ+dGhpcy52aWV3LnN2Zy5ub2RlKCk7XG4gICAgICAgICAgICBsZXQgcmVjdE5vZGU6IFNWR1NWR0VsZW1lbnQgPSA8U1ZHU1ZHRWxlbWVudD5yZWN0Lm5vZGUoKTtcblxuICAgICAgICAgICAgbGV0IHNlbGVjdGlvblJlY3QgPSBzdmdOb2RlLmNyZWF0ZVNWR1JlY3QoKTtcbiAgICAgICAgICAgIHNlbGVjdGlvblJlY3QueCA9IHJlY3RMZWZ0ICsgb2Zmc2V0WDtcbiAgICAgICAgICAgIHNlbGVjdGlvblJlY3QueSA9IHJlY3RUb3AgKyBvZmZzZXRZO1xuICAgICAgICAgICAgc2VsZWN0aW9uUmVjdC53aWR0aCA9IHJlY3RXaWR0aDtcbiAgICAgICAgICAgIHNlbGVjdGlvblJlY3QuaGVpZ2h0ID0gcmVjdEhlaWdodDtcbiAgICAgICAgICAgIGxldCBub2RlcyA9IHN2Z05vZGUuZ2V0SW50ZXJzZWN0aW9uTGlzdChzZWxlY3Rpb25SZWN0LCBudWxsKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRMZXZlbCA9PT0gJ05laWdoYm9yaG9vZHMnKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5laWdoYm9yaG9vZHM6IE5laWdoYm9yaG9vZFtdID0gW107XG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdGlvbjogU2VsZWN0RXZlbnREYXRhO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZGF0YSA9IG5vZGVzLml0ZW0oaSlbJ19fZGF0YV9fJ107XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ3VycmVudCBzZWxlY3RlZCBub2RlIGlzIGEgbmVpZ2hib3Job29kXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGFbJ2xpc3RpbmdzJ10gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3Job29kcy5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIChuZXdTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gT3ZlcndyaXRlIHRoZSBzZWxlY3Rpb24gd2l0aCB0aGUgc2VsZWN0ZWQgbmVpZ2hib3Job29kc1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24gPSBEaXNwYXRjaC5lbXB0eVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24ubmVpZ2hib3Job29kcyA9IG5laWdoYm9yaG9vZHM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBBZGQgYW55IG5ld2x5IHNlbGVjdGVkIG5laWdoYm9yaG9vZHMgdG8gdGhlIHNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24gPSBEaXNwYXRjaC5jbG9uZVNlbGVjdGlvbih0aGlzLnNlbGVjdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgbiBvZiBuZWlnaGJvcmhvb2RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZWN0aW9uLm5laWdoYm9yaG9vZHMuaW5kZXhPZihuKSA9PT0gLTEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLm5laWdoYm9yaG9vZHMucHVzaChuKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKERpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLCBzZWxlY3Rpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IGxpc3RpbmdzOiBMaXN0aW5nW10gPSBbXTtcbiAgICAgICAgICAgICAgICBsZXQgc2VsZWN0aW9uOiBTZWxlY3RFdmVudERhdGE7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRhID0gbm9kZXMuaXRlbShpKVsnX19kYXRhX18nXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDdXJyZW50IHNlbGVjdGVkIG5vZGUgaXMgYSBsaXN0aW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGFbJ25laWdoYm9yaG9vZCddICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RpbmdzLnB1c2goZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAobmV3U2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIE92ZXJ3cml0ZSB0aGUgc2VsZWN0aW9uIHdpdGggdGhlIHNlbGVjdGVkIGxpc3RpbmdzXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbiA9IERpc3BhdGNoLmVtcHR5U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5saXN0aW5ncyA9IGxpc3RpbmdzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGFueSBuZXdseSBzZWxlY3RlZCBsaXN0aW5ncyB0byB0aGUgc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbiA9IERpc3BhdGNoLmNsb25lU2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBsIG9mIGxpc3RpbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZWN0aW9uLmxpc3RpbmdzLmluZGV4T2YobCkgPT09IC0xKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5saXN0aW5ncy5wdXNoKGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmNhbGwoRGlzcGF0Y2hFdmVudC5TZWxlY3QsIHRoaXMsIHNlbGVjdGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcGF0aCBmcm9tIGV4aXN0ZW5jZVxuICAgICAgICAgICAgLy8gcGF0aC5yZW1vdmUoKTtcbiAgICAgICAgICAgIHJlY3QucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZUNpcmNsZXMoKSB7XG4gICAgICAgIHRoaXMudmlldy5jaXJjbGVzQ29udGFpbmVyR3JvdXAgPSB0aGlzLnZpZXcuc3ZnLmFwcGVuZCgnZycpLmF0dHIoJ2NsYXNzJywgJ2NpcmNsZXMtY29udGFpbmVyJyk7XG4gICAgICAgIHRoaXMudmlldy5jaXJjbGVzQ29udGFpbmVyUm9vdCA9IHRoaXMudmlldy5jaXJjbGVzQ29udGFpbmVyR3JvdXAuYXBwZW5kKCdzdmcnKTtcbiAgICAgICAgdGhpcy52aWV3LmNpcmNsZXNDb250YWluZXJSb290LmFwcGVuZCgncmVjdCcpLmF0dHIoJ2NsYXNzJywgJ2JhY2tmaWxsJykuc3R5bGUoJ2N1cnNvcicsICdjcm9zc2hhaXInKTtcbiAgICAgICAgdGhpcy52aWV3LmNpcmNsZXNDb250YWluZXJJbm5lciA9IHRoaXMudmlldy5jaXJjbGVzQ29udGFpbmVyUm9vdC5hcHBlbmQoJ2cnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRpYWxpemVab29tKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgdmFyIHpvb20gPSBkMy56b29tKClcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gT25seSBhbGxvdyB6b29taW5nIG9uIHNjcm9sbCB3aGVlbCwgb3IgcGFubmluZyBvbiBhbHQtY2xpY2tcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQgaW5zdGFuY2VvZiBXaGVlbEV2ZW50KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChldmVudCBpbnN0YW5jZW9mIE1vdXNlRXZlbnQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudC5idXR0b24gPT09IDAgJiYgZXZlbnQuYWx0S2V5O1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignem9vbScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxldCB0cmFuc2Zvcm06IGQzLlpvb21UcmFuc2Zvcm0gPSBkMy5ldmVudC50cmFuc2Zvcm07XG4gICAgICAgICAgICAgICAgbGV0IG1hcmt1cEF4aXM6IGQzLkF4aXM8YW55PjtcbiAgICAgICAgICAgICAgICBsZXQgb3RoZXJBeGlzOiBkMy5BeGlzPGFueT47XG5cbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5zZWxlY3RlZEF0dHJpYnV0ZS5raW5kID09PSAnY29udGludW91cycpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtID0gZDMuZXZlbnQudHJhbnNmb3JtO1xuICAgICAgICAgICAgICAgICAgICBtYXJrdXBBeGlzID0gZDMuYXhpc0xlZnQoc2VsZi52aWV3Lm1hcmt1cFNjYWxlKS5zY2FsZSh0cmFuc2Zvcm0ucmVzY2FsZVkoc2VsZi52aWV3Lm1hcmt1cFNjYWxlKSk7XG4gICAgICAgICAgICAgICAgICAgIG90aGVyQXhpcyA9IGQzLmF4aXNCb3R0b20oc2VsZi52aWV3Lm90aGVyU2NhbGUpLnNjYWxlKHRyYW5zZm9ybS5yZXNjYWxlWChzZWxmLnZpZXcub3RoZXJTY2FsZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtID0gZDMuem9vbUlkZW50aXR5O1xuICAgICAgICAgICAgICAgICAgICBtYXJrdXBBeGlzID0gZDMuYXhpc0xlZnQoc2VsZi52aWV3Lm1hcmt1cFNjYWxlKS5zY2FsZSh0cmFuc2Zvcm0ucmVzY2FsZVkoc2VsZi52aWV3Lm1hcmt1cFNjYWxlKSk7XG4gICAgICAgICAgICAgICAgICAgIG90aGVyQXhpcyA9IGQzLmF4aXNCb3R0b20oc2VsZi52aWV3Lm90aGVyU2NhbGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vdXBkYXRlIGF4aXNcbiAgICAgICAgICAgICAgICBzZWxmLnZpZXcuc3ZnLnNlbGVjdCgnZy5vdGhlci1heGlzJykuY2FsbChvdGhlckF4aXMpO1xuICAgICAgICAgICAgICAgIHNlbGYudmlldy5zdmcuc2VsZWN0KCdnLm1hcmt1cC1heGlzJykuY2FsbChtYXJrdXBBeGlzKTtcblxuICAgICAgICAgICAgICAgIC8vem9vbSB0byBuZWlnaGJvcmhvb2RzXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYudmlldy5uZWlnaGJvcmhvb2RDaXJjbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudmlldy5uZWlnaGJvcmhvb2RDaXJjbGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgdHJhbnNmb3JtICsgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigncicsIGQgPT4gc2VsZi52aWV3LnNpemVTY2FsZShBdHRyaWJ1dGUuY291bnQubmVpZ2hib3Job29kQWNjZXNzb3IoZCkpIC8gdHJhbnNmb3JtLmspO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vem9vbSB0byBsaXN0aW5nc1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnZpZXcubGlzdGluZ0NpcmNsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi52aWV3Lmxpc3RpbmdDaXJjbGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigndHJhbnNmb3JtJywgdHJhbnNmb3JtICsgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYXR0cigncicsIGQgPT4gc2VsZi52aWV3LnNpemVTY2FsZShBdHRyaWJ1dGUuY291bnQuYWNjZXNzb3IoZCkpIC8gdHJhbnNmb3JtLmspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vcmVzZXQgem9vbSAgXG4gICAgICAgIHRoaXMudmlldy5vdmVybGF5LnNlbGVjdCgnLnJlc2V0LXpvb20nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgdHJhbnNpdGlvbiA9IGQzLnRyYW5zaXRpb24obnVsbCkuZHVyYXRpb24oNTAwKTtcbiAgICAgICAgICAgIGxldCBtYXJrdXBBeGlzID0gZDMuYXhpc0xlZnQoc2VsZi52aWV3Lm1hcmt1cFNjYWxlKTtcbiAgICAgICAgICAgIGxldCBvdGhlckF4aXMgPSBkMy5heGlzQm90dG9tKHNlbGYudmlldy5vdGhlclNjYWxlKTtcblxuICAgICAgICAgICAgc2VsZi52aWV3LnN2Zy5zZWxlY3QoJ2cub3RoZXItYXhpcycpLnRyYW5zaXRpb24odHJhbnNpdGlvbikuY2FsbChvdGhlckF4aXMpO1xuICAgICAgICAgICAgc2VsZi52aWV3LnN2Zy5zZWxlY3QoJ2cubWFya3VwLWF4aXMnKS50cmFuc2l0aW9uKHRyYW5zaXRpb24pLmNhbGwobWFya3VwQXhpcyk7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnZpZXcubmVpZ2hib3Job29kQ2lyY2xlcykge1xuICAgICAgICAgICAgICAgIHNlbGYudmlldy5uZWlnaGJvcmhvb2RDaXJjbGVzXG4gICAgICAgICAgICAgICAgICAudHJhbnNpdGlvbih0cmFuc2l0aW9uKVxuICAgICAgICAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZSgwLDApc2NhbGUoMSlcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnZpZXcubGlzdGluZ0NpcmNsZXMpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnZpZXcubGlzdGluZ0NpcmNsZXNcbiAgICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKHRyYW5zaXRpb24pXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMCkgc2NhbGUoMSlcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYudmlldy5jaXJjbGVzQ29udGFpbmVyUm9vdFxuICAgICAgICAgICAgICAgIC50cmFuc2l0aW9uKHRyYW5zaXRpb24pXG4gICAgICAgICAgICAgICAgLmNhbGwoem9vbS50cmFuc2Zvcm0sIGQzLnpvb21JZGVudGl0eSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vY2FsbCBpZiBpbiBkcmFnIGFyZWFcbiAgICAgICAgdGhpcy52aWV3LmNpcmNsZXNDb250YWluZXJSb290LmNhbGwoem9vbSk7XG4gICAgICAgIHRoaXMudmlldy56b29tID0gem9vbTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZVRpdGxlKCkge1xuICAgICAgICBsZXQgdGl0bGUgPSAnJztcblxuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExldmVsID09PSAnTmVpZ2hib3Job29kcycpXG4gICAgICAgICAgICB0aXRsZSArPSAnTmVpZ2hib3Job29kICc7XG4gICAgICAgIGVsc2UgICBcbiAgICAgICAgICAgIHRpdGxlICs9ICdJbmRpdmlkdWFsICc7XG5cbiAgICAgICAgdGl0bGUgKz0gJyBNYXJrdXAgdnMuICc7XG4gICAgICAgIHRpdGxlICs9IHRoaXMuc2VsZWN0ZWRBdHRyaWJ1dGUubmFtZTtcblxuICAgICAgICB0aGlzLnZpZXcudGl0bGUudGV4dCh0aXRsZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB1cGRhdGVTY2FsZXMoKSB7XG4gICAgICAgIGxldCB3aWR0aCA9IHRoaXMuZWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgbGV0IGhlaWdodCA9IHRoaXMuZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGxldCBpbm5lclBhZGRpbmcgPSBkMy5QYWRkaW5nLmFkZCh0aGlzLnZpZXcucGFkZGluZywgbmV3IGQzLlBhZGRpbmcoMCwgNDAsIDQwLCAwKSk7XG5cbiAgICAgICAgbGV0IG1hcmt1cERvbWFpbjogYW55O1xuICAgICAgICBsZXQgc2l6ZURvbWFpbjogYW55O1xuICAgICAgICBsZXQgb3RoZXJEb21haW46IGFueTtcblxuICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIGRvbWFpbnMgb2YgdGhlIHNjYWxlc1xuICAgICAgICBpZiAodGhpcy5zZWxlY3RlZExldmVsID09PSAnTmVpZ2hib3Job29kcycpIHtcbiAgICAgICAgICAgIGxldCBkYXRhID0gdGhpcy5maWx0ZXJlZE5laWdoYm9yaG9vZHM7XG4gICAgICAgICAgICBtYXJrdXBEb21haW4gPSBBdHRyaWJ1dGUubWFya3VwLm5laWdoYm9yaG9vZERvbWFpbihkYXRhKTtcbiAgICAgICAgICAgIHNpemVEb21haW4gPSBBdHRyaWJ1dGUuY291bnQubmVpZ2hib3Job29kRG9tYWluKGRhdGEpO1xuICAgICAgICAgICAgb3RoZXJEb21haW4gPSB0aGlzLnNlbGVjdGVkQXR0cmlidXRlLm5laWdoYm9yaG9vZERvbWFpbihkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCBkYXRhID0gdGhpcy5maWx0ZXJlZExpc3RpbmdzO1xuICAgICAgICAgICAgbWFya3VwRG9tYWluID0gQXR0cmlidXRlLm1hcmt1cC5saXN0aW5nRG9tYWluKGRhdGEpO1xuICAgICAgICAgICAgc2l6ZURvbWFpbiA9IEF0dHJpYnV0ZS5jb3VudC5saXN0aW5nRG9tYWluKGRhdGEpO1xuICAgICAgICAgICAgb3RoZXJEb21haW4gPSB0aGlzLnNlbGVjdGVkQXR0cmlidXRlLmxpc3RpbmdEb21haW4oZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGRvbWFpbnMgb2YgdGhlIHNjYWxlc1xuICAgICAgICB0aGlzLnZpZXcubWFya3VwU2NhbGUgPSBkMy5zY2FsZUxpbmVhcigpLmRvbWFpbihtYXJrdXBEb21haW4pO1xuICAgICAgICB0aGlzLnZpZXcuc2l6ZVNjYWxlID0gZDMuc2NhbGVMaW5lYXIoKS5kb21haW4oc2l6ZURvbWFpbik7XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRBdHRyaWJ1dGUua2luZCA9PT0gJ2NvbnRpbnVvdXMnKSB7IFxuICAgICAgICAgICAgdGhpcy52aWV3Lm90aGVyU2NhbGUgPSBkMy5zY2FsZUxpbmVhcigpLmRvbWFpbihvdGhlckRvbWFpbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGhpcy5zZWxlY3RlZEF0dHJpYnV0ZS5raW5kID09PSAnb3JkaW5hbCcpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5vdGhlclNjYWxlID0gZDMuc2NhbGVQb2ludCgpLmRvbWFpbihvdGhlckRvbWFpbikucGFkZGluZygxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgcmFuZ2VzIG9mIHRoZSBzY2FsZXNcbiAgICAgICAgdGhpcy52aWV3Lm1hcmt1cFNjYWxlLnJhbmdlKFtpbm5lclBhZGRpbmcuaGVpZ2h0KGhlaWdodCkgKyBpbm5lclBhZGRpbmcudG9wLCBpbm5lclBhZGRpbmcudG9wXSk7XG4gICAgICAgIHRoaXMudmlldy5vdGhlclNjYWxlLnJhbmdlKFtpbm5lclBhZGRpbmcubGVmdCwgaW5uZXJQYWRkaW5nLmxlZnQgKyBpbm5lclBhZGRpbmcud2lkdGgod2lkdGgpXSk7XG5cbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRMZXZlbCA9PT0gJ05laWdoYm9yaG9vZHMnKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc2l6ZVNjYWxlLnJhbmdlKFs1LCAzMF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aWV3LnNpemVTY2FsZS5yYW5nZShbNSwgNV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uTG9hZChkYXRhOiBMb2FkRXZlbnREYXRhKSB7XG4gICAgICAgIHN1cGVyLm9uTG9hZChkYXRhKTtcblxuICAgICAgICB0aGlzLmluaXRpYWxpemVRdWFkcmFudHMoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplQXhlcygpOyBcbiAgICAgICAgdGhpcy5pbml0aWFsaXplTGV2ZWxTZWxlY3QoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplQ2lyY2xlcygpO1xuICAgICAgICB0aGlzLmluaXRpYWxpemVEcmFnKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZVpvb20oKTtcblxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvblNlbGVjdChzZWxlY3Rpb246IFNlbGVjdEV2ZW50RGF0YSkge1xuICAgICAgICBzdXBlci5vblNlbGVjdChzZWxlY3Rpb24pO1xuXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkTGV2ZWwgPT09ICdOZWlnaGJvcmhvb2RzJykge1xuICAgICAgICAgICAgdGhpcy52aWV3Lm5laWdoYm9yaG9vZENpcmNsZXMuYXR0cignZmlsbCcsIGQgPT4gdGhpcy5nZXROZWlnaGJvcmhvb2RDaXJjbGVGaWxsKGQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5saXN0aW5nQ2lyY2xlcy5hdHRyKCdmaWxsJywgZCA9PiB0aGlzLmdldExpc3RpbmdDaXJjbGVGaWxsKGQpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkhpZ2hsaWdodChoaWdobGlnaHQ6IEhpZ2hsaWdodEV2ZW50RGF0YSkge1xuICAgICAgICBzdXBlci5vbkhpZ2hsaWdodChoaWdobGlnaHQpO1xuXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkTGV2ZWwgPT09ICdOZWlnaGJvcmhvb2RzJykge1xuICAgICAgICAgICAgdGhpcy52aWV3Lm5laWdoYm9yaG9vZENpcmNsZXMuYXR0cignZmlsbCcsIGQgPT4gdGhpcy5nZXROZWlnaGJvcmhvb2RDaXJjbGVGaWxsKGQpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5saXN0aW5nQ2lyY2xlcy5hdHRyKCdmaWxsJywgZCA9PiB0aGlzLmdldExpc3RpbmdDaXJjbGVGaWxsKGQpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvbkZpbHRlcihmaWx0ZXI6IEZpbHRlckV2ZW50RGF0YSkge1xuICAgICAgICBzdXBlci5vbkZpbHRlcihmaWx0ZXIpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXNpemUoKSB7XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldE5laWdoYm9yaG9vZENpcmNsZUZpbGwobmVpZ2hib3Job29kOiBOZWlnaGJvcmhvb2QpIDogc3RyaW5nIHtcbiAgICAgICAgbGV0IHNlbGVjdGVkTmVpZ2hib3Job29kcyA9IHRoaXMuc2VsZWN0aW9uLm5laWdoYm9yaG9vZHMgfHwgW107XG4gICAgICAgIGxldCBoaWdobGlnaHRlZE5laWdoYm9yaG9vZCA9IHRoaXMuaGlnaGxpZ2h0Lm5laWdoYm9yaG9vZDtcblxuICAgICAgICBpZiAoc2VsZWN0ZWROZWlnaGJvcmhvb2RzLmluZGV4T2YobmVpZ2hib3Job29kKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAncmdiYSgyNTUsIDEwMCwgMTAwLCAwLjUpJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuZWlnaGJvcmhvb2QgPT09IGhpZ2hsaWdodGVkTmVpZ2hib3Job29kKSBcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3JnYmEoMjU1LCAxMDAsIDEwMCwgMC41KSc7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuICdyZ2JhKDU2LCAxMTEsIDE2NCwgMC41KSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldExpc3RpbmdDaXJjbGVGaWxsKGxpc3Rpbmc6IExpc3RpbmcpIDogc3RyaW5nIHtcbiAgICAgICAgbGV0IHNlbGVjdGVkTGlzdGluZ3MgPSB0aGlzLmFsbFNlbGVjdGVkTGlzdGluZ3M7XG4gICAgICAgIGxldCBoaWdobGlnaHRlZExpc3RpbmcgPSB0aGlzLmhpZ2hsaWdodC5saXN0aW5nO1xuICAgICAgICBcbiAgICAgICAgaWYgKHNlbGVjdGVkTGlzdGluZ3MuaW5kZXhPZihsaXN0aW5nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAncmdiYSgyNTUsIDEwMCwgMTAwLCAwLjUpJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmhpZ2hsaWdodC5saXN0aW5nID09PSBsaXN0aW5nIHx8IHRoaXMuaGlnaGxpZ2h0Lm5laWdoYm9yaG9vZCA9PT0gbGlzdGluZy5uZWlnaGJvcmhvb2QpIFxuICAgICAgICAgICAgICAgIHJldHVybiAncmdiYSgyNTUsIDEwMCwgMTAwLCAwLjUpJztcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3JnYmEoNTYsIDExMSwgMTY0LCAwLjUpJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZHJhd1F1YWRyYW50cyh3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgdHJhbnNpdGlvbiA9IGQzLnRyYW5zaXRpb24obnVsbCkpIHtcbiAgICAgICAgLy8gVE9ETzogZGV0ZXJtaW5lIGhvdyB0aGVzZSBxdWFkcmFudHMgd2lsbCBiZSBwbGFjZWRcbiAgICAgICAgbGV0IHF1YWRyYW50U3BsaXRYID0gd2lkdGgvMjtcbiAgICAgICAgbGV0IHF1YWRyYW50U3BsaXRZID0gaGVpZ2h0LzI7XG4gICAgICAgIGxldCBwYWRkaW5nID0gNTtcblxuICAgICAgICB0aGlzLnZpZXcucXVhZHJhbnRMaW5lSG9yaXpvbnRhbFxuICAgICAgICAgICAgLmF0dHIoJ3gxJywgMClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsICB3aWR0aClcbiAgICAgICAgICAudHJhbnNpdGlvbih0cmFuc2l0aW9uKVxuICAgICAgICAgICAgLmF0dHIoJ3kxJywgcXVhZHJhbnRTcGxpdFkpXG4gICAgICAgICAgICAuYXR0cigneTInLCBxdWFkcmFudFNwbGl0WSk7XG5cbiAgICAgICAgdGhpcy52aWV3LnF1YWRyYW50TGluZVZlcnRpY2FsXG4gICAgICAgICAgICAuYXR0cigneTEnLCAwKVxuICAgICAgICAgICAgLmF0dHIoJ3kyJywgaGVpZ2h0KVxuICAgICAgICAgIC50cmFuc2l0aW9uKHRyYW5zaXRpb24pXG4gICAgICAgICAgICAuYXR0cigneDEnLCBxdWFkcmFudFNwbGl0WClcbiAgICAgICAgICAgIC5hdHRyKCd4MicsIHF1YWRyYW50U3BsaXRYKTtcbiAgICAgICAgICAgIFxuXG4gICAgICAgIHRoaXMudmlldy5xdWFkcmFudExhYmVsc1xuICAgICAgICAgICAgLmF0dHIoJ3gnLCAoZCxpKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSW5kaWNlcyAwIGFuZCAyIGFyZSBvbiB0aGUgbGVmdCBxdWFkcmFudHNcbiAgICAgICAgICAgICAgICAvLyBJbmRpY2VzIDEgYW5kIDMgYXJlIG9uIHRoZSByaWdodCBxdWFkcmFudHNcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFkZGluZyArICgoaSA9PT0gMCB8fCBpID09PSAyKSA/IDAgOiBxdWFkcmFudFNwbGl0WCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmF0dHIoJ3knLCAoZCxpKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gSW5kaWNlcyAwIGFuZCAxIGFyZSBvbiB0aGUgdG9wIHF1YWRyYW50c1xuICAgICAgICAgICAgICAgIC8vIEluZGljZXMgMiBhbmQgMyBhcmUgb24gdGhlIGJvdHRvbSBxdWFkcmFudHNcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFkZGluZyArICgoaSA9PT0gMCB8fCBpID09PSAxKSA/IDAgOiBxdWFkcmFudFNwbGl0WSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRyYXdOZWlnaGJvcmhvb2RzKHRyYW5zaXRpb24gPSBkMy50cmFuc2l0aW9uKG51bGwpKSB7XG4gICAgICAgIGxldCBuZWlnaGJvcmhvb2RzVHJhbnNpdGlvbkFjdGlvbnMgPSAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgY2lyY2xlU2VsZWN0aW9uID0gdGhpcy52aWV3LmNpcmNsZXNDb250YWluZXJJbm5lclxuICAgICAgICAgICAgICAgIC5zZWxlY3RBbGwoJ2NpcmNsZS5uZWlnaGJvcmhvb2QnKVxuICAgICAgICAgICAgICAgICAgICAuZGF0YSh0aGlzLmZpbHRlcmVkTmVpZ2hib3Job29kcywgKG46IE5laWdoYm9yaG9vZCkgPT4gbi5uYW1lKTtcblxuICAgICAgICAgICAgbGV0IGNpcmNsZUVudGVyID0gY2lyY2xlU2VsZWN0aW9uLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKCdjaXJjbGUnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICduZWlnaGJvcmhvb2QnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgMClcbiAgICAgICAgICAgICAgICAuYXR0cignY3gnLCBkID0+IHRoaXMudmlldy5vdGhlclNjYWxlKHRoaXMuc2VsZWN0ZWRBdHRyaWJ1dGUubmVpZ2hib3Job29kQWNjZXNzb3IoZCkgfHwgMCkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2N5JywgZCA9PiB0aGlzLnZpZXcubWFya3VwU2NhbGUoQXR0cmlidXRlLm1hcmt1cC5uZWlnaGJvcmhvb2RBY2Nlc3NvcihkKSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3InLCBkID0+IHRoaXMudmlldy5zaXplU2NhbGUoQXR0cmlidXRlLmNvdW50Lm5laWdoYm9yaG9vZEFjY2Vzc29yKGQpKSlcbiAgICAgICAgICAgICAgICAub24oJ21vdXNlZW50ZXInLCBkID0+IHRoaXMuZGlzcGF0Y2hOZWlnaGJvcmhvb2RIaWdobGlnaHQoZCwgdHJ1ZSkpXG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZWxlYXZlJywgZCA9PiB0aGlzLmRpc3BhdGNoTmVpZ2hib3Job29kSGlnaGxpZ2h0KGQsIGZhbHNlKSlcbiAgICAgICAgICAgICAgICAub24oJ2NsaWNrJywgZCA9PiB0aGlzLmRpc3BhdGNoTmVpZ2hib3Job29kU2VsZWN0aW9uKGQsICFkMy5ldmVudC5zaGlmdEtleSkpO1xuXG4gICAgICAgICAgICBjaXJjbGVTZWxlY3Rpb24uZXhpdCgpXG4gICAgICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oMjUwKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgMClcbiAgICAgICAgICAgICAgICAucmVtb3ZlKCk7XG5cbiAgICAgICAgICAgIHRoaXMudmlldy5uZWlnaGJvcmhvb2RDaXJjbGVzID0gY2lyY2xlU2VsZWN0aW9uLm1lcmdlKGNpcmNsZUVudGVyKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5uZWlnaGJvcmhvb2RDaXJjbGVzXG4gICAgICAgICAgICAgIC50cmFuc2l0aW9uKCkuZHVyYXRpb24oMTAwMClcbiAgICAgICAgICAgICAgICAuYXR0cignY3gnLCBkID0+IHRoaXMudmlldy5vdGhlclNjYWxlKHRoaXMuc2VsZWN0ZWRBdHRyaWJ1dGUubmVpZ2hib3Job29kQWNjZXNzb3IoZCkgfHwgMCkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2N5JywgZCA9PiB0aGlzLnZpZXcubWFya3VwU2NhbGUoQXR0cmlidXRlLm1hcmt1cC5uZWlnaGJvcmhvb2RBY2Nlc3NvcihkKSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3InLCBkID0+IHRoaXMudmlldy5zaXplU2NhbGUoQXR0cmlidXRlLmNvdW50Lm5laWdoYm9yaG9vZEFjY2Vzc29yKGQpKSlcbiAgICAgICAgICAgICAgICAuYXR0cignZmlsbCcsIGQgPT4gdGhpcy5nZXROZWlnaGJvcmhvb2RDaXJjbGVGaWxsKGQpKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkQXR0cmlidXRlLmtpbmQgPT09ICdjb250aW51b3VzJyAmJiBpc05hTih0aGlzLnNlbGVjdGVkQXR0cmlidXRlLm5laWdoYm9yaG9vZEFjY2Vzc29yKGQpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9KTs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBhIHpvb20gdHJhbnNmb3JtIGV4aXN0czpcbiAgICAgICAgbGV0IHRyYW5zZm9ybSA9IGQzLnpvb21UcmFuc2Zvcm0odGhpcy52aWV3LmNpcmNsZXNDb250YWluZXJSb290Lm5vZGUoKSBhcyBFbGVtZW50KTtcbiAgICAgICAgaWYgKCEodHJhbnNmb3JtLnggPT09IDAgJiYgdHJhbnNmb3JtLnkgPT09IDAgJiYgdHJhbnNmb3JtLmsgPT09IDEpKSB7XG4gICAgICAgICAgICAvLyBSZXNldCB0aGUgem9vbSB0cmFuc2Zvcm1cbiAgICAgICAgICAgIHRoaXMudmlldy5jaXJjbGVzQ29udGFpbmVyUm9vdFxuICAgICAgICAgICAgICAudHJhbnNpdGlvbih0cmFuc2l0aW9uKVxuICAgICAgICAgICAgICAgIC5jYWxsKHRoaXMudmlldy56b29tLnRyYW5zZm9ybSwgZDMuem9vbUlkZW50aXR5KTtcblxuICAgICAgICAgICAgLy8gVHJhbnNpdGlvbiB0aGUgZWxlbWVudHMgYWZ0ZXIgdGhlIHRyYW5zZm9ybSB0cmFuc2l0aW9uXG4gICAgICAgICAgICB0cmFuc2l0aW9uID0gdHJhbnNpdGlvbi50cmFuc2l0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy52aWV3Lm5laWdoYm9yaG9vZENpcmNsZXMgJiYgdGhpcy52aWV3Lmxpc3RpbmdDaXJjbGVzKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcubGlzdGluZ0NpcmNsZXNcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKVxuICAgICAgICAgICAgICAudHJhbnNpdGlvbih0cmFuc2l0aW9uKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjeCcsIGQgPT4gdGhpcy52aWV3Lm90aGVyU2NhbGUodGhpcy5zZWxlY3RlZEF0dHJpYnV0ZS5uZWlnaGJvcmhvb2RBY2Nlc3NvcihkLm5laWdoYm9yaG9vZCkgfHwgMCkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2N5JywgZCA9PiB0aGlzLnZpZXcubWFya3VwU2NhbGUoQXR0cmlidXRlLm1hcmt1cC5uZWlnaGJvcmhvb2RBY2Nlc3NvcihkLm5laWdoYm9yaG9vZCkpKVxuICAgICAgICAgICAgICAudHJhbnNpdGlvbigpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3InLCBkID0+IHRoaXMudmlldy5zaXplU2NhbGUoQXR0cmlidXRlLmNvdW50Lm5laWdoYm9yaG9vZEFjY2Vzc29yKGQubmVpZ2hib3Job29kKSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwKTtcblxuICAgICAgICAgICAgdGhpcy52aWV3Lm5laWdoYm9yaG9vZENpcmNsZXNcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ3BvaW50ZXItZXZlbnRzJywgJ2F1dG8nKVxuICAgICAgICAgICAgLnRyYW5zaXRpb24odHJhbnNpdGlvbilcbiAgICAgICAgICAgICAgICAuYXR0cignY3gnLCBkID0+IHRoaXMudmlldy5vdGhlclNjYWxlKHRoaXMuc2VsZWN0ZWRBdHRyaWJ1dGUubmVpZ2hib3Job29kQWNjZXNzb3IoZCkgfHwgMCkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2N5JywgZCA9PiB0aGlzLnZpZXcubWFya3VwU2NhbGUoQXR0cmlidXRlLm1hcmt1cC5uZWlnaGJvcmhvb2RBY2Nlc3NvcihkKSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3InLCBkID0+IHRoaXMudmlldy5zaXplU2NhbGUoQXR0cmlidXRlLmNvdW50Lm5laWdoYm9yaG9vZEFjY2Vzc29yKGQpKSlcbiAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbigxMDAwKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdGVkQXR0cmlidXRlLmtpbmQgPT09ICdjb250aW51b3VzJyAmJiBpc05hTih0aGlzLnNlbGVjdGVkQXR0cmlidXRlLm5laWdoYm9yaG9vZEFjY2Vzc29yKGQpKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdHJhbnNpdGlvbi5vbignZW5kJywgbmVpZ2hib3Job29kc1RyYW5zaXRpb25BY3Rpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnZpZXcubGlzdGluZ0NpcmNsZXMpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5saXN0aW5nQ2lyY2xlc1xuICAgICAgICAgICAgICAgIC5zdHlsZSgncG9pbnRlci1ldmVudHMnLCAnbm9uZScpXG4gICAgICAgICAgICAgIC50cmFuc2l0aW9uKHRyYW5zaXRpb24pXG4gICAgICAgICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHRyYW5zaXRpb24ub24oJ2VuZCcsIG5laWdoYm9yaG9vZHNUcmFuc2l0aW9uQWN0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZWlnaGJvcmhvb2RzVHJhbnNpdGlvbkFjdGlvbnMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZHJhd0xpc3RpbmdzKHRyYW5zaXRpb24gPSBkMy50cmFuc2l0aW9uKG51bGwpKSB7XG4gICAgICAgIGxldCBsaXN0aW5nc1RyYW5zaXRpb25BY3Rpb25zID0gKCkgPT4ge1xuICAgICAgICAgICAgbGV0IGNpcmNsZVNlbGVjdGlvbiA9IHRoaXMudmlldy5jaXJjbGVzQ29udGFpbmVySW5uZXJcbiAgICAgICAgICAgICAgICAuc2VsZWN0QWxsKCdjaXJjbGUubGlzdGluZycpXG4gICAgICAgICAgICAgICAgICAgIC5kYXRhKHRoaXMuZmlsdGVyZWRMaXN0aW5ncywgKGw6IExpc3RpbmcpID0+IGwuaWQgKyAnJyk7XG5cbiAgICAgICAgICAgIGxldCBjaXJjbGVFbnRlciA9IGNpcmNsZVNlbGVjdGlvbi5lbnRlcigpXG4gICAgICAgICAgICAgICAgLmFwcGVuZCgnY2lyY2xlJylcbiAgICAgICAgICAgICAgICAuYXR0cignY2xhc3MnLCAnbGlzdGluZycpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjeCcsIGQgPT4gdGhpcy52aWV3Lm90aGVyU2NhbGUodGhpcy5zZWxlY3RlZEF0dHJpYnV0ZS5hY2Nlc3NvcihkKSB8fCAwKSlcbiAgICAgICAgICAgICAgICAuYXR0cignY3knLCBkID0+IHRoaXMudmlldy5tYXJrdXBTY2FsZShBdHRyaWJ1dGUubWFya3VwLmFjY2Vzc29yKGQpKSlcbiAgICAgICAgICAgICAgICAuYXR0cigncicsIGQgPT4gdGhpcy52aWV3LnNpemVTY2FsZShBdHRyaWJ1dGUucHJpY2UuYWNjZXNzb3IoZCkpKVxuICAgICAgICAgICAgICAgIC5vbignbW91c2VlbnRlcicsIGQgPT4gdGhpcy5kaXNwYXRjaExpc3RpbmdIaWdobGlnaHQoZCwgdHJ1ZSkpXG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZWxlYXZlJywgZCA9PiB0aGlzLmRpc3BhdGNoTGlzdGluZ0hpZ2hsaWdodChkLCBmYWxzZSkpXG4gICAgICAgICAgICAgICAgLm9uKCdjbGljaycsIGQgPT4gdGhpcy5kaXNwYXRjaExpc3RpbmdTZWxlY3Rpb24oZCwgIWQzLmV2ZW50LnNoaWZ0S2V5KSk7XG5cbiAgICAgICAgICAgIGNpcmNsZVNlbGVjdGlvbi5leGl0KClcbiAgICAgICAgICAgICAgLnRyYW5zaXRpb24oKS5kdXJhdGlvbigyNTApXG4gICAgICAgICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCAwKVxuICAgICAgICAgICAgICAgIC5yZW1vdmUoKTtcblxuICAgICAgICAgICAgdGhpcy52aWV3Lmxpc3RpbmdDaXJjbGVzID0gY2lyY2xlU2VsZWN0aW9uLm1lcmdlKGNpcmNsZUVudGVyKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5saXN0aW5nQ2lyY2xlc1xuICAgICAgICAgICAgICAudHJhbnNpdGlvbigpLmR1cmF0aW9uKDEwMDApXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2N4JywgZCA9PiB0aGlzLnZpZXcub3RoZXJTY2FsZSh0aGlzLnNlbGVjdGVkQXR0cmlidXRlLmFjY2Vzc29yKGQpIHx8IDApKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdjeScsIGQgPT4gdGhpcy52aWV3Lm1hcmt1cFNjYWxlKEF0dHJpYnV0ZS5tYXJrdXAuYWNjZXNzb3IoZCkpKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdyJywgZCA9PiB0aGlzLnZpZXcuc2l6ZVNjYWxlKEF0dHJpYnV0ZS5wcmljZS5hY2Nlc3NvcihkKSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ2ZpbGwnLCBkID0+IHRoaXMuZ2V0TGlzdGluZ0NpcmNsZUZpbGwoZCkpXG4gICAgICAgICAgICAgICAgLmF0dHIoJ29wYWNpdHknLCBkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRBdHRyaWJ1dGUua2luZCA9PT0gJ2NvbnRpbnVvdXMnICYmIGlzTmFOKHRoaXMuc2VsZWN0ZWRBdHRyaWJ1dGUuYWNjZXNzb3IoZCkpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIElmIGEgem9vbSB0cmFuc2Zvcm0gZXhpc3RzOlxuICAgICAgICBsZXQgdHJhbnNmb3JtID0gZDMuem9vbVRyYW5zZm9ybSh0aGlzLnZpZXcuY2lyY2xlc0NvbnRhaW5lclJvb3Qubm9kZSgpIGFzIEVsZW1lbnQpO1xuICAgICAgICBpZiAoISh0cmFuc2Zvcm0ueCA9PT0gMCAmJiB0cmFuc2Zvcm0ueSA9PT0gMCAmJiB0cmFuc2Zvcm0uayA9PT0gMSkpIHtcbiAgICAgICAgICAgIC8vIFJlc2V0IHRoZSB6b29tIHRyYW5zZm9ybVxuICAgICAgICAgICAgdGhpcy52aWV3LmNpcmNsZXNDb250YWluZXJSb290XG4gICAgICAgICAgICAgIC50cmFuc2l0aW9uKHRyYW5zaXRpb24pXG4gICAgICAgICAgICAgICAgLmNhbGwodGhpcy52aWV3Lnpvb20udHJhbnNmb3JtLCBkMy56b29tSWRlbnRpdHkpO1xuXG4gICAgICAgICAgICAvLyBUcmFuc2l0aW9uIHRoZSBlbGVtZW50cyBhZnRlciB0aGUgdHJhbnNmb3JtIHRyYW5zaXRpb25cbiAgICAgICAgICAgIHRyYW5zaXRpb24gPSB0cmFuc2l0aW9uLnRyYW5zaXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnZpZXcubGlzdGluZ0NpcmNsZXMgJiYgdGhpcy52aWV3Lm5laWdoYm9yaG9vZENpcmNsZXMpIHtcbiAgICAgICAgICAgIHRyYW5zaXRpb24uZHVyYXRpb24oNTAwKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy52aWV3Lmxpc3RpbmdDaXJjbGVzXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdwb2ludGVyLWV2ZW50cycsICdhdXRvJylcbiAgICAgICAgICAgICAgLnRyYW5zaXRpb24odHJhbnNpdGlvbilcbiAgICAgICAgICAgICAgICAuYXR0cignb3BhY2l0eScsIGQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZEF0dHJpYnV0ZS5raW5kID09PSAnY29udGludW91cycgJiYgaXNOYU4odGhpcy5zZWxlY3RlZEF0dHJpYnV0ZS5hY2Nlc3NvcihkKSkpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMudmlldy5uZWlnaGJvcmhvb2RDaXJjbGVzXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdwb2ludGVyLWV2ZW50cycsICdub25lJylcbiAgICAgICAgICAgICAgLnRyYW5zaXRpb24odHJhbnNpdGlvbilcbiAgICAgICAgICAgICAgICAuYXR0cignb3BhY2l0eScsIDApO1xuXG4gICAgICAgICAgICB0cmFuc2l0aW9uLm9uKCdlbmQnLCBsaXN0aW5nc1RyYW5zaXRpb25BY3Rpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnZpZXcubmVpZ2hib3Job29kQ2lyY2xlcykge1xuICAgICAgICAgICAgdGhpcy52aWV3Lm5laWdoYm9yaG9vZENpcmNsZXNcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ3BvaW50ZXItZXZlbnRzJywgJ25vbmUnKVxuICAgICAgICAgICAgICAudHJhbnNpdGlvbih0cmFuc2l0aW9uKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdvcGFjaXR5JywgMCk7XG5cbiAgICAgICAgICAgIHRyYW5zaXRpb24ub24oJ2VuZCcsIGxpc3RpbmdzVHJhbnNpdGlvbkFjdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGlzdGluZ3NUcmFuc2l0aW9uQWN0aW9ucygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGxldCB3aWR0aCA9IHRoaXMuZWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgbGV0IGhlaWdodCA9IHRoaXMuZWxlbWVudC5jbGllbnRIZWlnaHQ7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBwYWRkaW5nIGZvciB0aGUgc2NhdHRlciBwbG90IGl0c2VsZlxuICAgICAgICBsZXQgaW5uZXJQYWRkaW5nID0gZDMuUGFkZGluZy5hZGQodGhpcy52aWV3LnBhZGRpbmcsIG5ldyBkMy5QYWRkaW5nKDAsIDQwLCA0MCwgMCkpO1xuXG4gICAgICAgIHRoaXMudXBkYXRlVGl0bGUoKTtcbiAgICAgICAgdGhpcy51cGRhdGVTY2FsZXMoKTtcblxuICAgICAgICBsZXQgdXBkYXRlVHJhbnNpdGlvbiA9IGQzLnRyYW5zaXRpb24obnVsbCkuZHVyYXRpb24oMTAwMCk7XG5cbiAgICAgICAgbGV0IG1hcmt1cEF4aXMgPSBkMy5heGlzTGVmdCh0aGlzLnZpZXcubWFya3VwU2NhbGUpO1xuICAgICAgICBsZXQgb3RoZXJBeGlzID0gZDMuYXhpc0JvdHRvbSh0aGlzLnZpZXcub3RoZXJTY2FsZSk7XG5cbiAgICAgICAgLy8gRHJhdyB0aGUgYXhlc1xuICAgICAgICB0aGlzLnZpZXcuc3ZnLnNlbGVjdCgnZy5tYXJrdXAtYXhpcycpXG4gICAgICAgICAgICAuc3R5bGUoJ3RyYW5zZm9ybScsIGlubmVyUGFkZGluZy50cmFuc2xhdGVYKDApKVxuICAgICAgICAgICAgLnRyYW5zaXRpb24odXBkYXRlVHJhbnNpdGlvbilcbiAgICAgICAgICAgIC5jYWxsKG1hcmt1cEF4aXMpO1xuXG4gICAgICAgIHRoaXMudmlldy5zdmcuc2VsZWN0KCdnLm90aGVyLWF4aXMnKVxuICAgICAgICAgICAgLnN0eWxlKCd0cmFuc2Zvcm0nLCBpbm5lclBhZGRpbmcudHJhbnNsYXRlWShpbm5lclBhZGRpbmcuaGVpZ2h0KGhlaWdodCkpKVxuICAgICAgICAgICAgLnRyYW5zaXRpb24odXBkYXRlVHJhbnNpdGlvbilcbiAgICAgICAgICAgIC5jYWxsKG90aGVyQXhpcyk7XG5cbiAgICAgICAgLy8gRHJhdyBheGlzIGxhYmVsc1xuICAgICAgICB0aGlzLnZpZXcuc3ZnLnNlbGVjdCgnZy5tYXJrdXAtYXhpcy1sYWJlbCcpXG4gICAgICAgICAgICAuc3R5bGUoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoJHt0aGlzLnZpZXcucGFkZGluZy5sZWZ0fXB4LCAke2lubmVyUGFkZGluZy5jZW50ZXJZKGhlaWdodCl9cHgpYCk7XG5cbiAgICAgICAgLy8gRHJhdyB0aGUgcXVhZHJhbnQgbGluZXMgYW5kIGxhYmVsc1xuICAgICAgICB0aGlzLnZpZXcuc3ZnLnNlbGVjdCgnZy5xdWFkcmFudC1hcmVhJykuc3R5bGUoJ3RyYW5zZm9ybScsIGlubmVyUGFkZGluZy50cmFuc2xhdGUoMCwwKSk7XG4gICAgICAgIC8vIHRoaXMuZHJhd1F1YWRyYW50cyhpbm5lclBhZGRpbmcud2lkdGgod2lkdGgpLCBpbm5lclBhZGRpbmcuaGVpZ2h0KGhlaWdodCksIHVwZGF0ZVRyYW5zaXRpb24pO1xuXG4gICAgICAgIHRoaXMudmlldy5vdmVybGF5XG4gICAgICAgICAgLnNlbGVjdCgnZGl2Lm90aGVyLWF4aXMtbGFiZWwnKVxuICAgICAgICAgICAgLnN0eWxlKCdsZWZ0JywgYCR7aW5uZXJQYWRkaW5nLmNlbnRlclgod2lkdGgpfXB4YClcbiAgICAgICAgICAgIC5zdHlsZSgndG9wJywgYCR7aGVpZ2h0IC0gdGhpcy52aWV3LnBhZGRpbmcuYm90dG9tfXB4YClcbiAgICAgICAgICAgIC5zdHlsZSgndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZVgoLTUwJSknKTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIGNpcmNsZXMgY29udGFpbmVyIFxuICAgICAgICB0aGlzLnZpZXcuY2lyY2xlc0NvbnRhaW5lckdyb3VwLnN0eWxlKCd0cmFuc2Zvcm0nLCBpbm5lclBhZGRpbmcudHJhbnNsYXRlKDAsMCkpO1xuICAgICAgICB0aGlzLnZpZXcuY2lyY2xlc0NvbnRhaW5lclJvb3RcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIGlubmVyUGFkZGluZy53aWR0aCh3aWR0aCkpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgaW5uZXJQYWRkaW5nLmhlaWdodChoZWlnaHQpKTtcbiAgICAgICAgdGhpcy52aWV3LmNpcmNsZXNDb250YWluZXJSb290XG4gICAgICAgICAgICAuYXR0cignZGF0YS1vZmZzZXQteCcsIGlubmVyUGFkZGluZy5sZWZ0KVxuICAgICAgICAgICAgLmF0dHIoJ2RhdGEtb2Zmc2V0LXknLCBpbm5lclBhZGRpbmcudG9wKVxuICAgICAgICAgIC5zZWxlY3QoJ3JlY3QuYmFja2ZpbGwnKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgaW5uZXJQYWRkaW5nLndpZHRoKHdpZHRoKSlcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCBpbm5lclBhZGRpbmcuaGVpZ2h0KGhlaWdodCkpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAndHJhbnNwYXJlbnQnKTtcbiAgICAgICAgdGhpcy52aWV3LmNpcmNsZXNDb250YWluZXJJbm5lclxuICAgICAgICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIGB0cmFuc2xhdGUoLSR7aW5uZXJQYWRkaW5nLmxlZnR9IC0ke2lubmVyUGFkZGluZy50b3B9KWApO1xuXG4gICAgICAgIC8vIERyYXcgdGhlIGl0ZW1zXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkTGV2ZWwgPT09ICdOZWlnaGJvcmhvb2RzJykge1xuICAgICAgICAgICAgdGhpcy5kcmF3TmVpZ2hib3Job29kcyh1cGRhdGVUcmFuc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnNlbGVjdGVkTGV2ZWwgPT09ICdMaXN0aW5ncycpIHtcbiAgICAgICAgICAgIHRoaXMuZHJhd0xpc3RpbmdzKHVwZGF0ZVRyYW5zaXRpb24pO1xuICAgICAgICB9XG5cdH1cbn0gIiwiaW1wb3J0ICogYXMgZDMgZnJvbSAnLi4vZDMnO1xuXG5pbXBvcnQgeyBCYXNlQ29tcG9uZW50IH0gZnJvbSAnLi9iYXNlLWNvbXBvbmVudCc7XG5pbXBvcnQgeyBEaXNwYXRjaCwgRGlzcGF0Y2hFdmVudCwgTG9hZEV2ZW50RGF0YSwgU2VsZWN0RXZlbnREYXRhLCBIaWdobGlnaHRFdmVudERhdGEsIEZpbHRlckV2ZW50RGF0YSB9IGZyb20gJy4uL2RhdGEvZGlzcGF0Y2gnO1xuaW1wb3J0IHsgTmVpZ2hib3Job29kR2VvSlNPTiwgTmVpZ2hib3Job29kR2VvSlNPTkZlYXR1cmUgfSBmcm9tICcuLi9kYXRhL2dlb2pzb24nO1xuaW1wb3J0IHsgTGlzdGluZywgTmVpZ2hib3Job29kIH0gZnJvbSAnLi4vZGF0YS9saXN0aW5nJztcbmltcG9ydCB7IEJsb2NrIH0gZnJvbSAnLi4vZGF0YS9ibG9jayc7XG5pbXBvcnQgeyBBdHRyaWJ1dGUgfSBmcm9tICcuLi9kYXRhL2F0dHJpYnV0ZSc7XG5cbmV4cG9ydCBjbGFzcyBEZXRhaWxDb21wb25lbnQgZXh0ZW5kcyBCYXNlQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgdmlldzoge1xuICAgICAgICBtb25leUZvcm1hdD86IChuOm51bWJlcikgPT4gc3RyaW5nO1xuXG4gICAgICAgIGxpc3RpbmdDb3VudERldGFpbD86IGQzLkRhdGFsZXNzU2VsZWN0aW9uO1xuICAgICAgICBtZWRpYW5QcmljZURldGFpbD86IGQzLkRhdGFsZXNzU2VsZWN0aW9uO1xuICAgICAgICBtZWRpYW5UcnVsaWFQcmljZT86IGQzLkRhdGFsZXNzU2VsZWN0aW9uO1xuICAgICAgICBsaXN0aW5nTGlua0RldGFpbD86IGQzLkRhdGFsZXNzU2VsZWN0aW9uO1xuXG4gICAgICAgIGFtZW5pdGllc0NvbG9yU2NhbGU/OiBkMy5TY2FsZUxpbmVhcjxzdHJpbmcsIHN0cmluZz47XG4gICAgICAgIGFtZW5pdGllc1NWRz86IGQzLkRhdGFsZXNzU2VsZWN0aW9uO1xuICAgICAgICBhbWVuaXRpZXNHcmlkPzogZDMuRGF0YVNlbGVjdGlvbjxbc3RyaW5nLCBudW1iZXJdPjtcbiAgICAgICAgYW1lbml0aWVzSG92ZXJEZXRhaWxzPzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhaXJibmJVcmwgPSAnaHR0cHM6Ly93d3cuYWlyYm5iLmNvbS9yb29tcy8nO1xuICAgIHByaXZhdGUgYW1lbml0aWVzTWFwOiBNYXA8c3RyaW5nLCBudW1iZXI+O1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHNlbGVjdG9yOiBzdHJpbmcsIGRpc3BhdGNoZXI6IERpc3BhdGNoKSB7XG4gICAgICAgIHN1cGVyKHNlbGVjdG9yLCBkaXNwYXRjaGVyKTtcblxuICAgICAgICB0aGlzLnZpZXcgPSB7fTtcbiAgICAgICAgdGhpcy52aWV3Lm1vbmV5Rm9ybWF0ID0gZDMuZm9ybWF0KCckLjJmJyk7XG4gICAgICAgIHRoaXMudmlldy5saXN0aW5nQ291bnREZXRhaWwgPSBkMy5zZWxlY3QodGhpcy5lbGVtZW50KS5zZWxlY3QoJyNkZXRhaWwtbGlzdGluZy1jb3VudCAuZGV0YWlsLXZhbHVlJyk7XG4gICAgICAgIHRoaXMudmlldy5tZWRpYW5QcmljZURldGFpbCA9IGQzLnNlbGVjdCh0aGlzLmVsZW1lbnQpLnNlbGVjdCgnI2RldGFpbC1tZWRpYW4tcHJpY2UgLmRldGFpbC12YWx1ZScpO1xuICAgICAgICB0aGlzLnZpZXcubWVkaWFuVHJ1bGlhUHJpY2UgPSBkMy5zZWxlY3QodGhpcy5lbGVtZW50KS5zZWxlY3QoJyNkZXRhaWwtbWVkaWFuLXRydWxpYS1wcmljZSAuZGV0YWlsLXZhbHVlJyk7XG4gICAgICAgIHRoaXMudmlldy5saXN0aW5nTGlua0RldGFpbCA9IGQzLnNlbGVjdCh0aGlzLmVsZW1lbnQpLnNlbGVjdCgnI2RldGFpbC1saXN0aW5nLWxpbmsnKTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMudmlldy5hbWVuaXRpZXNDb2xvclNjYWxlID0gZDMuc2NhbGVMaW5lYXI8c3RyaW5nPigpLnJhbmdlKFsnI2VkZjhmYicsICcjMzg2ZmE0J10pO1xuICAgICAgICB0aGlzLnZpZXcuYW1lbml0aWVzU1ZHID0gZDMuc2VsZWN0KHRoaXMuZWxlbWVudClcbiAgICAgICAgICAuc2VsZWN0KCcjZGV0YWlsLWFtZW5pdGllcyAuZGV0YWlsLXZhbHVlJylcbiAgICAgICAgICAuYXBwZW5kKCdzdmcnKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2FtZW5pdGllcy1ncmlkJylcbiAgICAgICAgICAgIC5hdHRyKCd3aWR0aCcsIDE1MClcbiAgICAgICAgICAgIC5hdHRyKCdoZWlnaHQnLCAxNjApO1xuICAgICAgICB0aGlzLnZpZXcuYW1lbml0aWVzSG92ZXJEZXRhaWxzID0gZDMuc2VsZWN0KHRoaXMuZWxlbWVudCkuc2VsZWN0KCcjZGV0YWlsLWFtZW5pdGllcyAuZGV0YWlsLW5hbWUgLmRldGFpbC1uYW1lLXN1YmluZm8nKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25Mb2FkKGRhdGE6IExvYWRFdmVudERhdGEpIHtcbiAgICAgICAgc3VwZXIub25Mb2FkKGRhdGEpO1xuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgYW1lbml0aWVzIG1hcCBmcm9tIHRoZSBkYXRhIHNldFxuICAgICAgICB0aGlzLmFtZW5pdGllc01hcCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KHRoaXMuZGF0YS5hbWVuaXRpZXMubWFwKChhbWVuaXR5KTpbc3RyaW5nLG51bWJlcl0gPT4gW2FtZW5pdHksIDBdKSlcblxuICAgICAgICAvLyBSZW5kZXIgdGhlIGRlZmF1bHQgZGV0YWlscyBcbiAgICAgICAgdGhpcy5yZW5kZXJBbGxEZXRhaWxzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uU2VsZWN0KHNlbGVjdGlvbjogU2VsZWN0RXZlbnREYXRhKSB7XG4gICAgICAgIHN1cGVyLm9uU2VsZWN0KHNlbGVjdGlvbik7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uSGlnaGxpZ2h0KGhpZ2hsaWdodDogSGlnaGxpZ2h0RXZlbnREYXRhKSB7XG4gICAgICAgIHN1cGVyLm9uSGlnaGxpZ2h0KGhpZ2hsaWdodCk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuXG4gICAgcHVibGljIG9uRmlsdGVyKGZpbHRlcjogRmlsdGVyRXZlbnREYXRhKSB7XG4gICAgICAgIHN1cGVyLm9uRmlsdGVyKGZpbHRlcik7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW5kZXJBbGxEZXRhaWxzKCkge1xuICAgICAgICAvLyBSZW5kZXIgZGV0YWlscyBmb3IgYWxsIG91ciBsaXN0aW5nc1xuICAgICAgICB0aGlzLnJlbmRlckxpc3RpbmdEZXRhaWxzKHRoaXMuZmlsdGVyZWRMaXN0aW5ncyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW5kZXJMaXN0aW5nRGV0YWlscyhsaXN0aW5nczogTGlzdGluZ1tdKSB7XG4gICAgICAgIC8vIFRoZSBudW1iZXIgb2YgbGlzdGluZ3MgaXMgdGhlIGNvdW50IG9mIGFsbCBjb21iaW5lZCBsaXN0aW5nc1xuICAgICAgICB0aGlzLnZpZXcubGlzdGluZ0NvdW50RGV0YWlsLnRleHQoXG4gICAgICAgICAgICBsaXN0aW5ncy5sZW5ndGhcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBUaGUgbWVkaWFuIHByaWNlIG9mIGFsbCBsaXN0aW5nc1xuICAgICAgICB0aGlzLnZpZXcubWVkaWFuUHJpY2VEZXRhaWwudGV4dChcbiAgICAgICAgICAgIHRoaXMudmlldy5tb25leUZvcm1hdChcbiAgICAgICAgICAgICAgICBkMy5tZWRpYW4obGlzdGluZ3MsIGwgPT4gQXR0cmlidXRlLnByaWNlLmFjY2Vzc29yKGwpKVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFRoZSB0cnVpYSBwcmljZVxuICAgICAgICBsZXQgbGlzdGluZ1RydWxpYVByaWNlID0gbGlzdGluZ3MuZmlsdGVyKGwgPT4gIWlzTmFOKGwucHJpY2VzLnRydWxpYS5yZW50X3Blcl9iZWRyb29tKSk7XG4gICAgICAgIGlmIChsaXN0aW5nVHJ1bGlhUHJpY2UubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy52aWV3Lm1lZGlhblRydWxpYVByaWNlLnRleHQoXG4gICAgICAgICAgICAgICAgIHRoaXMudmlldy5tb25leUZvcm1hdChcbiAgICAgICAgICAgICAgICAgICAgICAgIGQzLm1lZGlhbihsaXN0aW5nVHJ1bGlhUHJpY2UsIGwgPT4gQXR0cmlidXRlLnRydWxpYVByaWNlLmFjY2Vzc29yKGwpKVxuICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aWV3Lm1lZGlhblRydWxpYVByaWNlLnRleHQoJ04vQScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGxpbmsgdG8gdGhlIGxpc3RpbmcgaWYgdGhlcmUgaXMgb25seSBvbmUgc2VsZWN0ZWRcbiAgICAgICAgaWYgKGxpc3RpbmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgdGhpcy52aWV3Lmxpc3RpbmdMaW5rRGV0YWlsXG4gICAgICAgICAgICAgICAgLnN0eWxlKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICAgICAgICAgICAgLnNlbGVjdCgnYS5kZXRhaWwtdmFsdWUnKVxuICAgICAgICAgICAgICAgIC5hdHRyKCdocmVmJywgdGhpcy5haXJibmJVcmwgKyBsaXN0aW5nc1swXS5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcubGlzdGluZ0xpbmtEZXRhaWxcbiAgICAgICAgICAgICAgICAuc3R5bGUoJ2Rpc3BsYXknLCAnbm9uZScpXG4gICAgICAgICAgICAgIC5zZWxlY3QoJ2EuZGV0YWlsLXZhbHVlJylcbiAgICAgICAgICAgICAgICAuYXR0cignaHJlZicsICcnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbmRlciB0aGUgYW1lbml0aWVzIGdyaWRcbiAgICAgICAgdGhpcy5yZW5kZXJBbWVuaXRpZXMobGlzdGluZ3MpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVuZGVyQW1lbml0aWVzKGxpc3RpbmdzOiBMaXN0aW5nW10pIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBhbWVuaXRpZXMgbWFwXG4gICAgICAgIGZvciAobGV0IGFtZW5pdHkgb2YgQXJyYXkuZnJvbSh0aGlzLmFtZW5pdGllc01hcC5rZXlzKCkpKSB7XG4gICAgICAgICAgICB0aGlzLmFtZW5pdGllc01hcC5zZXQoYW1lbml0eSwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDb3VudCB0aGUgZnJlcXVlbmN5IG9mIGFtZW5pdGllcyBmb3IgdGhlc2UgbGlzdGluZ3NcbiAgICAgICAgZm9yIChsZXQgbGlzdGluZyBvZiBsaXN0aW5ncykge1xuICAgICAgICAgICAgZm9yIChsZXQgYW1lbml0eSBvZiBsaXN0aW5nLmFtZW5pdGllcykge1xuICAgICAgICAgICAgICAgIC8vIElmIHdlIGFyZSB0cmFja2luZyB0aGlzIGFtZW5pdHksIHVwZGF0ZSBpdFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmFtZW5pdGllc01hcC5oYXMoYW1lbml0eSkpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYW1lbml0aWVzTWFwLnNldChhbWVuaXR5LCB0aGlzLmFtZW5pdGllc01hcC5nZXQoYW1lbml0eSkgKyAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgYW1lbml0eSBjb2xvciBzY2FsZVxuICAgICAgICB0aGlzLnZpZXcuYW1lbml0aWVzQ29sb3JTY2FsZS5kb21haW4oZDMuZXh0ZW50KEFycmF5LmZyb20odGhpcy5hbWVuaXRpZXNNYXAudmFsdWVzKCkpKSk7XG5cbiAgICAgICAgLy8gVGhlIGdyaWQgd2lsbCBiZSBhIDUtY29sdW1uIGdyaWQsIHNwYW5uaW5nIGFwcHJveGltYXRlbHkgMTUwIHBpeGVscyBpbiB3aWR0aFxuICAgICAgICBsZXQgZ3JpZEJveFNpZGVMZW5ndGggPSAyMDtcbiAgICAgICAgbGV0IGdyaWRTcGFjaW5nID0gMztcbiAgICAgICAgbGV0IGdyaWRCb3hlc1BlclJvdyA9IDU7XG5cbiAgICAgICAgbGV0IGNvbHVtbkluZGV4ID0gKGk6bnVtYmVyKSA9PiBpICUgZ3JpZEJveGVzUGVyUm93O1xuICAgICAgICBsZXQgcm93SW5kZXggPSAoaTpudW1iZXIpID0+IE1hdGguZmxvb3IoaSAvIGdyaWRCb3hlc1BlclJvdyk7XG5cbiAgICAgICAgLy8gU2VsZWN0IHRoZSBncmlkIG9mIGFtZW5pdGllc1xuICAgICAgICBsZXQgYW1lbml0aWVzU2VsZWN0aW9uID0gdGhpcy52aWV3LmFtZW5pdGllc1NWR1xuICAgICAgICAgIC5zZWxlY3RBbGwoJ3JlY3QuYW1lbml0eScpXG4gICAgICAgICAgICAuZGF0YShBcnJheS5mcm9tKHRoaXMuYW1lbml0aWVzTWFwLmVudHJpZXMoKSksIGVudHJ5ID0+IGVudHJ5WzBdKTtcblxuICAgICAgICAvLyBEcmF3IHRoZSBncmlkIG9mIGFtZW5pdGllcyBmb3IgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgbGV0IGFtZW5pdGllc0VudGVyID0gYW1lbml0aWVzU2VsZWN0aW9uXG4gICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgICAgIC5hdHRyKCdjbGFzcycsICdhbWVuaXR5JylcbiAgICAgICAgICAgIC5hdHRyKCd4JywgKGQsaSkgPT4gY29sdW1uSW5kZXgoaSkgKiAoZ3JpZEJveFNpZGVMZW5ndGggKyBncmlkU3BhY2luZykpXG4gICAgICAgICAgICAuYXR0cigneScsIChkLGkpID0+IHJvd0luZGV4KGkpICogKGdyaWRCb3hTaWRlTGVuZ3RoICsgZ3JpZFNwYWNpbmcpKVxuICAgICAgICAgICAgLmF0dHIoJ3dpZHRoJywgZ3JpZEJveFNpZGVMZW5ndGgpXG4gICAgICAgICAgICAuYXR0cignaGVpZ2h0JywgZ3JpZEJveFNpZGVMZW5ndGgpXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZS13aWR0aCcsIDApXG4gICAgICAgICAgICAuc3R5bGUoJ3N0cm9rZScsICdibGFjaycpXG4gICAgICAgICAgICAuc3R5bGUoJ2ZpbGwnLCAnd2hpdGUnKVxuICAgICAgICAgICAgLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oW2FtZW5pdHksIGNvdW50XSkge1xuICAgICAgICAgICAgICAgIC8vIERvbid0IGludGVyYWN0IHdpdGggdGhpcyBhbWVuaXR5IGlmIGl0J3MgZmlsdGVyZWQgb3V0XG4gICAgICAgICAgICAgICAgaWYgKCFzZWxmLmlzQW1lbml0eUVuYWJsZWQoYW1lbml0eSkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGxldCBzZWwgPSBkMy5zZWxlY3QodGhpcyk7XG5cbiAgICAgICAgICAgICAgICBsZXQgbGlzdGluZ0NvdW50ID0gK3NlbC5hdHRyKCdkYXRhLWxpc3RpbmdzLWNvdW50Jyk7XG4gICAgICAgICAgICAgICAgbGV0IGxpc3RpbmdQZXJjZW50YWdlID0gKGNvdW50L2xpc3RpbmdDb3VudCoxMDApLnRvRml4ZWQoMCk7XG5cbiAgICAgICAgICAgICAgICAvLyBIaWdobGlnaHQgdGhpcyBncmlkIHNxdWFyZVxuICAgICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgc2VsZi5nZXRBbWVuaXR5U3Ryb2tlV2lkdGgoYW1lbml0eSwgdHJ1ZSkpO1xuXG4gICAgICAgICAgICAgICAgLy8gU2hvdyB0aGUgZGV0YWlscyBvZiB0aGlzIGFtZW5pdHlcbiAgICAgICAgICAgICAgICBzZWxmLnZpZXcuYW1lbml0aWVzSG92ZXJEZXRhaWxzLmh0bWwoYFxuICAgICAgICAgICAgICAgICAgICAke2FtZW5pdHl9XG4gICAgICAgICAgICAgICAgICAgIDxicj5cbiAgICAgICAgICAgICAgICAgICAgJHtjb3VudH0gbGlzdGluZ3MgKCR7bGlzdGluZ1BlcmNlbnRhZ2V9JSlcbiAgICAgICAgICAgICAgICBgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihbYW1lbml0eSwgY291bnRdKSB7XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgaW50ZXJhY3Qgd2l0aCB0aGlzIGFtZW5pdHkgaWYgaXQncyBmaWx0ZXJlZCBvdXRcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuaXNBbWVuaXR5RW5hYmxlZChhbWVuaXR5KSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gVW5oaWdobGlnaHQgdGhpcyBncmlkIHNxdWFyZVxuICAgICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgc2VsZi5nZXRBbWVuaXR5U3Ryb2tlV2lkdGgoYW1lbml0eSwgZmFsc2UpKTtcblxuICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoZSBhbWVuaXR5IGRldGFpbHNcbiAgICAgICAgICAgICAgICBzZWxmLnZpZXcuYW1lbml0aWVzSG92ZXJEZXRhaWxzLmh0bWwoJycpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbihbYW1lbml0eSwgY291bnRdKSB7XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgaW50ZXJhY3Qgd2l0aCB0aGlzIGFtZW5pdHkgaWYgaXQncyBmaWx0ZXJlZCBvdXRcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuaXNBbWVuaXR5RW5hYmxlZChhbWVuaXR5KSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgLy8gU2VuZCBhIHNlbGVjdGlvbiBldmVudCBmb3IgdGhpcyBhbWVuaXR5XG4gICAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaEFtZW5pdHlTZWxlY3Rpb24oYW1lbml0eSwgIWQzLmV2ZW50LnNoaWZ0S2V5KTsgIFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBhbWVuaXRpZXMgZ3JpZFxuICAgICAgICB0aGlzLnZpZXcuYW1lbml0aWVzR3JpZCA9IGFtZW5pdGllc1NlbGVjdGlvbi5tZXJnZShhbWVuaXRpZXNFbnRlcik7XG4gICAgICAgIHRoaXMudmlldy5hbWVuaXRpZXNHcmlkXG4gICAgICAgICAgICAuYXR0cignZGF0YS1saXN0aW5ncy1jb3VudCcsIGxpc3RpbmdzLmxlbmd0aClcbiAgICAgICAgICAgIC5zdHlsZSgnZmlsbCcsIGQgPT4gdGhpcy5nZXRBbWVuaXR5RmlsbChkKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpc0FtZW5pdHlFbmFibGVkKGFtZW5pdHk6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gISh0aGlzLmZpbHRlci5hbWVuaXRpZXMubGVuZ3RoICYmIHRoaXMuZmlsdGVyLmFtZW5pdGllcy5pbmRleE9mKGFtZW5pdHkpID09PSAtMSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRBbWVuaXR5RmlsbChbYW1lbml0eSwgY291bnRdOiBbc3RyaW5nLCBudW1iZXJdKSB7XG4gICAgICAgIGlmICh0aGlzLmZpbHRlci5hbWVuaXRpZXMubGVuZ3RoICYmIHRoaXMuZmlsdGVyLmFtZW5pdGllcy5pbmRleE9mKGFtZW5pdHkpID09PSAtMSlcbiAgICAgICAgICAgIHJldHVybiAnZ3JleSc7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZpZXcuYW1lbml0aWVzQ29sb3JTY2FsZShjb3VudCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRBbWVuaXR5U3Ryb2tlV2lkdGgoYW1lbml0eTogc3RyaW5nLCBob3ZlcjogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGlvbi5hbWVuaXRpZXMuaW5kZXhPZihhbWVuaXR5KSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGhvdmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZXNpemUoKSB7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgLy8gS2VlcCB0cmFjayBvZiBhbGwgdGhlIGxpc3RpbmdzIHRoYXQgYXJlIHNlbGVjdGVkXG4gICAgICAgIGlmIChEaXNwYXRjaC5pc0VtcHR5U2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKSkge1xuICAgICAgICAgICAgLy8gSWYgc29tZXRoaW5nIGlzIGhpZ2hsaWdodGVkLCB0aGVuIHJlbmRlciB0aG9zZVxuICAgICAgICAgICAgaWYgKHRoaXMuaGlnaGxpZ2h0Lm5laWdoYm9yaG9vZCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyTGlzdGluZ0RldGFpbHModGhpcy5oaWdobGlnaHQubmVpZ2hib3Job29kLmxpc3RpbmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuaGlnaGxpZ2h0Lmxpc3RpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckxpc3RpbmdEZXRhaWxzKFt0aGlzLmhpZ2hsaWdodC5saXN0aW5nXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBOb3RoaW5nIHdhcyBzZWxlY3RlZCwgc28gcmVuZGVyIHRoZSBkZWZhdWx0IGRldGFpbHNcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckFsbERldGFpbHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFJlbmRlciBhbGwgc2VsZWN0ZWQgbGlzdGluZ3NcbiAgICAgICAgICAgIHRoaXMucmVuZGVyTGlzdGluZ0RldGFpbHModGhpcy5hbGxTZWxlY3RlZExpc3RpbmdzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlLWNvbG9yIGFtZW5pdGllc1xuICAgICAgICB0aGlzLnZpZXcuYW1lbml0aWVzR3JpZC5zdHlsZSgnZmlsbCcsIGQgPT4gdGhpcy5nZXRBbWVuaXR5RmlsbChkKSk7XG5cbiAgICAgICAgLy8gSGlnaGxpZ2h0IHRoZSBzZWxlY3RlZCBhbWVuaXRpZXMsIGlmIGFueVxuICAgICAgICB0aGlzLnZpZXcuYW1lbml0aWVzR3JpZC5zdHlsZSgnc3Ryb2tlLXdpZHRoJywgKFthbWVuaXR5LCBjb3VudF0pID0+IHRoaXMuZ2V0QW1lbml0eVN0cm9rZVdpZHRoKGFtZW5pdHkpKTtcbiAgICB9XG59ICIsImltcG9ydCAqIGFzIGQzIGZyb20gJy4uL2QzJztcblxuaW1wb3J0IHsgQmFzZUNvbXBvbmVudCB9IGZyb20gJy4vYmFzZS1jb21wb25lbnQnO1xuaW1wb3J0IHsgRGlzcGF0Y2gsIERpc3BhdGNoRXZlbnQsIExvYWRFdmVudERhdGEsIFNlbGVjdEV2ZW50RGF0YSwgSGlnaGxpZ2h0RXZlbnREYXRhLCBGaWx0ZXJFdmVudERhdGEgfSBmcm9tICcuLi9kYXRhL2Rpc3BhdGNoJztcbmltcG9ydCB7IEF0dHJpYnV0ZSB9IGZyb20gJy4uL2RhdGEvYXR0cmlidXRlJztcbmltcG9ydCB7IExpc3RpbmcsIE5laWdoYm9yaG9vZCB9IGZyb20gJy4uL2RhdGEvbGlzdGluZyc7XG5pbXBvcnQgeyBCbG9jayB9IGZyb20gJy4uL2RhdGEvYmxvY2snO1xuXG5leHBvcnQgY2xhc3MgU2VsZWN0aW9uQ29tcG9uZW50IGV4dGVuZHMgQmFzZUNvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIHZpZXc6IHtcbiAgICAgICAgbmVpZ2hib3Job29kU2VsZWN0aW9uTGlzdD86IGQzLkRhdGFTZWxlY3Rpb248TmVpZ2hib3Job29kPjtcbiAgICAgICAgbGlzdGluZ3NTZWxlY3Rpb25MaXN0PzogZDMuRGF0YVNlbGVjdGlvbjxMaXN0aW5nPjtcbiAgICAgICAgcHJpY2VCbG9ja3NTZWxlY3Rpb25MaXN0PzogZDMuRGF0YVNlbGVjdGlvbjxCbG9jaz47XG4gICAgICAgIG1hcmt1cEJsb2Nrc1NlbGVjdGlvbkxpc3Q/OiBkMy5EYXRhU2VsZWN0aW9uPEJsb2NrPjtcbiAgICAgICAgYW1lbml0aWVzU2VsZWN0aW9uTGlzdD86IGQzLkRhdGFTZWxlY3Rpb248c3RyaW5nPjtcblxuICAgICAgICBsaW5rcz86IGQzLkRhdGFsZXNzU2VsZWN0aW9uO1xuICAgIH1cblxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcihzZWxlY3Rvcjogc3RyaW5nLCBkaXNwYXRjaGVyOiBEaXNwYXRjaCkge1xuICAgICAgICBzdXBlcihzZWxlY3RvciwgZGlzcGF0Y2hlcik7XG5cbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMudmlldyA9IHt9O1xuICAgICAgICB0aGlzLnZpZXcubGlua3MgPSBkMy5zZWxlY3QodGhpcy5lbGVtZW50LnBhcmVudEVsZW1lbnQpLnNlbGVjdCgnLnNlbGVjdGlvbi1saW5rcycpO1xuICAgICAgICB0aGlzLnZpZXcubGlua3NcbiAgICAgICAgICAgIC5zZWxlY3QoJ2EucmVzZXQnKVxuICAgICAgICAgICAgLm9uKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChEaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgRGlzcGF0Y2guZW1wdHlTZWxlY3Rpb24oKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgdGhpcy52aWV3LmxpbmtzXG4gICAgICAgICAgICAuc2VsZWN0KCdhLmFwcGx5LWZpbHRlcicpXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRpc2FibGVkID0gZDMuc2VsZWN0KHRoaXMpLmNsYXNzZWQoJ2Rpc2FibGVkJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWRpc2FibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hlci5jYWxsKERpc3BhdGNoRXZlbnQuRmlsdGVyLCBzZWxmLCBEaXNwYXRjaC5maWx0ZXJGcm9tU2VsZWN0aW9uKHNlbGYuc2VsZWN0aW9uKSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hlci5jYWxsKERpc3BhdGNoRXZlbnQuU2VsZWN0LCBzZWxmLCBEaXNwYXRjaC5lbXB0eVNlbGVjdGlvbigpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9ICBcbiAgICBwcml2YXRlIGVuZm9yY2VIZWlnaHQoKSB7XG4gICAgICAgIC8vIEVuZm9yY2UgdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSBzZWxlY3Rpb25cbiAgICAgICAgbGV0IGhlaWdodCA9IHRoaXMuZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIGQzLnNlbGVjdCh0aGlzLmVsZW1lbnQpXG4gICAgICAgICAgLnNlbGVjdCgnLnNlbGVjdGlvbi1jb250YWluZXInKVxuICAgICAgICAgICAgLnN0eWxlKCdtYXgtaGVpZ2h0JywgYCR7aGVpZ2h0IC0gMTB9cHhgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25TZWxlY3Qoc2VsZWN0aW9uOiBTZWxlY3RFdmVudERhdGEpIHtcbiAgICAgICAgc3VwZXIub25TZWxlY3Qoc2VsZWN0aW9uKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzaXplKCkge1xuXG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW5kZXJOZWlnaGJvcmhvb2RzKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHNlbGVjdGlvblNlbGVjdGlvbiA9IGQzLnNlbGVjdCh0aGlzLnNlbGVjdG9yKVxuICAgICAgICAgICAgLnNlbGVjdCgnLnNlbGVjdGlvbi1uZWlnaGJvcmhvb2RzJylcbiAgICAgICAgICAgIC5zZWxlY3RBbGwoJ2RpdicpXG4gICAgICAgICAgICAuZGF0YSh0aGlzLnNlbGVjdGlvbi5uZWlnaGJvcmhvb2RzIHx8IFtdLCAoZDogTmVpZ2hib3Job29kKSA9PiBkLm5hbWUpO1xuXG4gICAgICAgIGxldCBzZWxlY3Rpb25FbnRlciA9IHNlbGVjdGlvblNlbGVjdGlvblxuICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgICAgIC50ZXh0KGQgPT4gZC5uYW1lKVxuICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIG91dCBhIGRlc2VsZWN0aW9uIGV2ZW50IGZvciB0aGlzIG5laWdoYm9yaG9vZFxuICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hOZWlnaGJvcmhvb2RTZWxlY3Rpb24oZCwgZmFsc2UpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IHNlbGVjdGlvbkV4aXQgPSBzZWxlY3Rpb25TZWxlY3Rpb24uZXhpdCgpLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLnZpZXcubmVpZ2hib3Job29kU2VsZWN0aW9uTGlzdCA9IHNlbGVjdGlvblNlbGVjdGlvbi5tZXJnZShzZWxlY3Rpb25FbnRlcik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW5kZXJMaXN0aW5ncygpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgbGV0IHNlbGVjdGlvblNlbGVjdGlvbiA9IGQzLnNlbGVjdCh0aGlzLnNlbGVjdG9yKVxuICAgICAgICAgICAgLnNlbGVjdCgnLnNlbGVjdGlvbi1saXN0aW5ncycpXG4gICAgICAgICAgICAuc2VsZWN0QWxsKCdkaXYnKVxuICAgICAgICAgICAgLmRhdGEodGhpcy5zZWxlY3Rpb24ubGlzdGluZ3MgfHwgW10sIChkOiBMaXN0aW5nKSA9PiBkLmlkICsgJycpO1xuXG4gICAgICAgIGxldCBzZWxlY3Rpb25FbnRlciA9IHNlbGVjdGlvblNlbGVjdGlvblxuICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgICAgIC50ZXh0KGQgPT4gZC5uYW1lKVxuICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIG91dCBhIGRlc2VsZWN0aW9uIGV2ZW50IGZvciB0aGlzIGxpc3RpbmdcbiAgICAgICAgICAgICAgICBzZWxmLmRpc3BhdGNoTGlzdGluZ1NlbGVjdGlvbihkLCBmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBsZXQgc2VsZWN0aW9uRXhpdCA9IHNlbGVjdGlvblNlbGVjdGlvbi5leGl0KCkucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMudmlldy5saXN0aW5nc1NlbGVjdGlvbkxpc3QgPSBzZWxlY3Rpb25TZWxlY3Rpb24ubWVyZ2Uoc2VsZWN0aW9uRW50ZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVuZGVyUHJpY2VCbG9ja3MoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIGxldCBzZWxlY3Rpb25TZWxlY3Rpb24gPSBkMy5zZWxlY3QodGhpcy5zZWxlY3RvcilcbiAgICAgICAgICAgIC5zZWxlY3QoJy5zZWxlY3Rpb24tcHJpY2UtYmxvY2tzJylcbiAgICAgICAgICAgIC5zZWxlY3RBbGwoJ2RpdicpXG4gICAgICAgICAgICAuZGF0YSh0aGlzLnNlbGVjdGlvbi5wcmljZUJsb2NrcyB8fCBbXSwgKGQ6IEJsb2NrKSA9PiBkLm51bWJlciArICcnKTtcblxuICAgICAgICBsZXQgc2VsZWN0aW9uRW50ZXIgPSBzZWxlY3Rpb25TZWxlY3Rpb25cbiAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgIC5hcHBlbmQoJ2RpdicpXG4gICAgICAgICAgICAudGV4dChkID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgbGFiZWwgPSAnJCcgKyBkLm1pbmltdW0udG9GaXhlZCgwKTtcblxuICAgICAgICAgICAgICAgIGlmIChpc05hTihkLm1heGltdW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsICs9ICcrJztcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCArPSAnIC0gJCcgKyBkLm1heGltdW0udG9GaXhlZCgwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIG91dCBhIGRlc2VsZWN0aW9uIGV2ZW50IGZvciB0aGlzIHByaWNlIGJsb2NrXG4gICAgICAgICAgICAgICAgc2VsZi5kaXNwYXRjaEJsb2NrU2VsZWN0aW9uKGQsIGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBzZWxlY3Rpb25FeGl0ID0gc2VsZWN0aW9uU2VsZWN0aW9uLmV4aXQoKS5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy52aWV3LnByaWNlQmxvY2tzU2VsZWN0aW9uTGlzdCA9IHNlbGVjdGlvblNlbGVjdGlvbi5tZXJnZShzZWxlY3Rpb25FbnRlcik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW5kZXJNYXJrdXBCbG9ja3MoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIGxldCBzZWxlY3Rpb25TZWxlY3Rpb24gPSBkMy5zZWxlY3QodGhpcy5zZWxlY3RvcilcbiAgICAgICAgICAgIC5zZWxlY3QoJy5zZWxlY3Rpb24tbWFya3VwLWJsb2NrcycpXG4gICAgICAgICAgICAuc2VsZWN0QWxsKCdkaXYnKVxuICAgICAgICAgICAgLmRhdGEodGhpcy5zZWxlY3Rpb24ubWFya3VwQmxvY2tzIHx8IFtdLCAoZDogQmxvY2spID0+IGQubnVtYmVyICsgJycpO1xuXG4gICAgICAgIGxldCBzZWxlY3Rpb25FbnRlciA9IHNlbGVjdGlvblNlbGVjdGlvblxuICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgLmFwcGVuZCgnZGl2JylcbiAgICAgICAgICAgIC50ZXh0KGQgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBsYWJlbCA9IGQubWluaW11bS50b0ZpeGVkKDApO1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKGQubWF4aW11bSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgKz0gJyslJztcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCArPSAnJSAtICcgKyBkLm1heGltdW0udG9GaXhlZCgwKSArICclJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIG91dCBhIGRlc2VsZWN0aW9uIGV2ZW50IGZvciB0aGlzIG1hcmt1cCBibG9ja1xuICAgICAgICAgICAgICAgIHNlbGYuZGlzcGF0Y2hCbG9ja1NlbGVjdGlvbihkLCBmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBsZXQgc2VsZWN0aW9uRXhpdCA9IHNlbGVjdGlvblNlbGVjdGlvbi5leGl0KCkucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMudmlldy5tYXJrdXBCbG9ja3NTZWxlY3Rpb25MaXN0ID0gc2VsZWN0aW9uU2VsZWN0aW9uLm1lcmdlKHNlbGVjdGlvbkVudGVyKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlckFtZW5pdGllcygpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgbGV0IHNlbGVjdGlvblNlbGVjdGlvbiA9IGQzLnNlbGVjdCh0aGlzLnNlbGVjdG9yKVxuICAgICAgICAgICAgLnNlbGVjdCgnLnNlbGVjdGlvbi1hbWVuaXRpZXMnKVxuICAgICAgICAgICAgLnNlbGVjdEFsbCgnZGl2JylcbiAgICAgICAgICAgIC5kYXRhKHRoaXMuc2VsZWN0aW9uLmFtZW5pdGllcyB8fCBbXSwgKGFtZW5pdHk6IHN0cmluZykgPT4gYW1lbml0eSk7XG5cbiAgICAgICAgbGV0IHNlbGVjdGlvbkVudGVyID0gc2VsZWN0aW9uU2VsZWN0aW9uXG4gICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdkaXYnKVxuICAgICAgICAgICAgLnRleHQoZCA9PiBkKVxuICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAvLyBTZW5kIG91dCBhIGRlc2VsZWN0aW9uIGV2ZW50IGZvciB0aGlzIGFtZW5pdHlcbiAgICAgICAgICAgICAgICBzZWxmLmRpc3BhdGNoQW1lbml0eVNlbGVjdGlvbihkLCBmYWxzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBsZXQgc2VsZWN0aW9uRXhpdCA9IHNlbGVjdGlvblNlbGVjdGlvbi5leGl0KCkucmVtb3ZlKCk7XG4gICAgICAgIHRoaXMudmlldy5hbWVuaXRpZXNTZWxlY3Rpb25MaXN0ID0gc2VsZWN0aW9uU2VsZWN0aW9uLm1lcmdlKHNlbGVjdGlvbkVudGVyKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlclNlbGVjdGlvbkxpbmtzKCkge1xuICAgICAgICAvLyBsZXQgcGx1cmFsaXplID0gKGNvdW50OiBudW1iZXIsIHdvcmQ6IHN0cmluZykgPT4ge1xuICAgICAgICAvLyAgICAgbGV0IGxhYmVsID0gY291bnQgKyAnICc7XG4gICAgICAgICAgICBcbiAgICAgICAgLy8gICAgIGlmIChjb3VudCA9PT0gMSkge1xuICAgICAgICAvLyAgICAgICAgIGxhYmVsICs9IHdvcmQ7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICBlbHNlIHtcbiAgICAgICAgLy8gICAgICAgICBpZiAod29yZC5jaGFyQXQod29yZC5sZW5ndGggLSAxKSA9PSAneScpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgbGFiZWwgKz0gd29yZC5zbGljZSgwLCB3b3JkLmxlbmd0aCAtIDEpICsgJ2llcyc7XG4gICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgIGVsc2Uge1xuICAgICAgICAvLyAgICAgICAgICAgICBsYWJlbCArPSB3b3JkICsgJ3MnO1xuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgIH1cblxuICAgICAgICAvLyAgICAgcmV0dXJuIGxhYmVsO1xuICAgICAgICAvLyB9O1xuXG4gICAgICAgIGlmIChEaXNwYXRjaC5pc0VtcHR5U2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKSkge1xuICAgICAgICAgICAgdGhpcy52aWV3LmxpbmtzLnN0eWxlKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChEaXNwYXRjaC5pc09ubHlMaXN0aW5nU2VsZWN0aW9uKHRoaXMuc2VsZWN0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudmlldy5saW5rcy5zZWxlY3QoJy5hcHBseS1maWx0ZXInKS5hdHRyKCdjbGFzcycsICdhcHBseS1maWx0ZXIgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMudmlldy5saW5rcy5zZWxlY3QoJy5hcHBseS1maWx0ZXInKS5hdHRyKCdjbGFzcycsICdhcHBseS1maWx0ZXInKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy52aWV3LmxpbmtzLnN0eWxlKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuZW5mb3JjZUhlaWdodCgpO1xuICAgICAgICB0aGlzLnJlbmRlck5laWdoYm9yaG9vZHMoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJMaXN0aW5ncygpO1xuICAgICAgICB0aGlzLnJlbmRlclByaWNlQmxvY2tzKCk7XG4gICAgICAgIHRoaXMucmVuZGVyTWFya3VwQmxvY2tzKCk7XG4gICAgICAgIHRoaXMucmVuZGVyQW1lbml0aWVzKCk7XG4gICAgICAgIHRoaXMucmVuZGVyU2VsZWN0aW9uTGlua3MoKTtcbiAgICB9XG59ICIsImltcG9ydCAqIGFzIGQzIGZyb20gJy4uL2QzJztcblxuZXhwb3J0IGludGVyZmFjZSBDaGVja2JveE11bHRpc2VsZWN0IHtcbiAgICB1cGRhdGUodGV4dD86IHN0cmluZyk6IHZvaWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBDaGVja2JveE11bHRpc2VsZWN0KG9yaWdpbmFsRWxlbWVudDogSFRNTFNlbGVjdEVsZW1lbnQsIHRleHQ/OiBzdHJpbmcpIDogQ2hlY2tib3hNdWx0aXNlbGVjdCB7XG4gICAgbGV0IG9yaWdpbmFsU2VsZWN0ID0gZDMuc2VsZWN0KG9yaWdpbmFsRWxlbWVudCksXG4gICAgICAgIGRpc3BsYXlTZWxlY3Q6IGQzLkRhdGFsZXNzU2VsZWN0aW9uO1xuICAgICAgICBcbiAgICBsZXQgZGlzcGxheUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzZWxlY3QnKTtcbiAgICBsZXQgZGlzcGxheU9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIFxuICAgIGxldCBvcmlnaW5hbE9wdGlvbnMgPSBvcmlnaW5hbFNlbGVjdC5zZWxlY3RBbGwoJ29wdGlvbi5jaG9pY2UnKSBhcyBkMy5TZWxlY3Rpb248SFRNTE9wdGlvbkVsZW1lbnQsIHt9LCBFbGVtZW50LCB7fT47XG5cbiAgICAvLyBGaXJzdCBoaWRlIHRoZSBzZWxlY3QgZWxlbWVudFxuICAgIG9yaWdpbmFsU2VsZWN0XG4gICAgICAgIC5zdHlsZSgndmlzaWJpbGl0eScsICdoaWRkZW4nKVxuICAgICAgICAuc3R5bGUoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG5cbiAgICAvLyBJbnNlcnQgdGhlIGRpc3BsYXkgPHNlbGVjdD4gZWxlbWVudCByaWdodCBhZnRlciBpdCBcbiAgICBvcmlnaW5hbEVsZW1lbnQucGFyZW50RWxlbWVudC5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2JlZm9yZWVuZCcsIGRpc3BsYXlFbGVtZW50KTtcbiAgICBkaXNwbGF5U2VsZWN0ID0gZDMuc2VsZWN0KGRpc3BsYXlFbGVtZW50KTtcblxuICAgIC8vIENyZWF0ZSBhIHNpbmdsZSBvcHRpb25cbiAgICBkaXNwbGF5T3B0aW9uLnRleHQgPSB0ZXh0O1xuICAgIGRpc3BsYXlFbGVtZW50LmFkZChkaXNwbGF5T3B0aW9uKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgY2hlY2tib3ggZGlzcGxheVxuICAgIGxldCBjaGVja2JveEhhc0ZvY3VzID0gZmFsc2U7XG4gICAgbGV0IGNoZWNrYm94ZXNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBvcmlnaW5hbEVsZW1lbnQucGFyZW50RWxlbWVudC5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2JlZm9yZWVuZCcsIGNoZWNrYm94ZXNDb250YWluZXIpO1xuICAgIGxldCBjaGVja2JveGVzQ29udGFpbmVyU2VsZWN0ID0gZDMuc2VsZWN0KGNoZWNrYm94ZXNDb250YWluZXIpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdjaGVja2JveC1tdWx0aXNlbGVjdCcpXG4gICAgICAgIC5zdHlsZSgnbWluLXdpZHRoJywgZGlzcGxheUVsZW1lbnQuY2xpZW50V2lkdGggKyAncHgnKVxuICAgICAgICAub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tib3hIYXNGb2N1cyA9IHRydWU7ICBcbiAgICAgICAgfSk7XG5cbiAgICBsZXQgY2hlY2tib3hlcyA9IGNoZWNrYm94ZXNDb250YWluZXJTZWxlY3RcbiAgICAgIC5zZWxlY3RBbGwoJ2lucHV0JylcbiAgICAgICAgLmRhdGEob3JpZ2luYWxPcHRpb25zLm5vZGVzKCkpO1xuXG4gICAgbGV0IGNoZWNrYm94ZXNFbnRlciA9IGNoZWNrYm94ZXMuZW50ZXIoKTtcbiAgICBjaGVja2JveGVzRW50ZXJcbiAgICAgIC5hcHBlbmQoJ2xhYmVsJylcbiAgICAgICAgLmF0dHIoJ2ZvcicsIGQgPT4gZC50ZXh0KVxuICAgICAgICAudGV4dChkID0+IGQudGV4dClcbiAgICAgICAgLnN0eWxlKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICAgICAgLm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNoZWNrYm94SGFzRm9jdXMgPSB0cnVlO1xuICAgICAgICB9KVxuICAgICAgLmFwcGVuZCgnaW5wdXQnKVxuICAgICAgICAuYXR0cigndHlwZScsICdjaGVja2JveCcpXG4gICAgICAgIC5hdHRyKCdpZCcsIGQgPT4gZC50ZXh0KVxuICAgICAgICAuYXR0cigndmFsdWUnLCBkID0+IGQudGV4dClcbiAgICAgICAgLnN0eWxlKCdmbG9hdCcsICdsZWZ0JylcbiAgICAgICAgLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICBkLnNlbGVjdGVkID0gKDxIVE1MSW5wdXRFbGVtZW50PnRoaXMpLmNoZWNrZWQ7XG4gICAgICAgICAgICBkLnBhcmVudEVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2NoYW5nZScpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKCdmb2N1cycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tib3hIYXNGb2N1cyA9IHRydWU7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbignYmx1cicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY2hlY2tib3hIYXNGb2N1cyA9IGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgIFxuICAgIC8vIFByZXZlbnQgdGhlIGRpc3BsYXkgZWxlbWVudCBmcm9tIHNob3dpbmcgdGhlIGRlZmF1bHQgbWVudVxuICAgIGRpc3BsYXlFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGRpc3BsYXlFbGVtZW50LmZvY3VzKCk7XG4gICAgfSk7XG5cbiAgICBkaXNwbGF5RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChjaGVja2JveGVzQ29udGFpbmVyU2VsZWN0LnN0eWxlKCdkaXNwbGF5JykgPT09ICdub25lJykge1xuICAgICAgICAgICAgY2hlY2tib3hlc0NvbnRhaW5lclNlbGVjdC5zdHlsZSgnZGlzcGxheScsICdibG9jaycpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBkaXNwbGF5RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2hlY2tib3hIYXNGb2N1cykge1xuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNoZWNrYm94ZXNDb250YWluZXJTZWxlY3Quc3R5bGUoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAzMyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gPENoZWNrYm94TXVsdGlzZWxlY3Q+e1xuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKHRleHQ/OiBzdHJpbmcpIHtcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheWVkIHRleHRcbiAgICAgICAgICAgIGRpc3BsYXlPcHRpb24udGV4dCA9IHRleHQ7XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgY2hlY2tib3hlcyBiYXNlZCBvbiB0aGUgc2VsZWN0ZWQgb3B0aW9uc1xuICAgICAgICAgICAgY2hlY2tib3hlc0NvbnRhaW5lclNlbGVjdFxuICAgICAgICAgICAgICAuc2VsZWN0QWxsKCdpbnB1dCcpXG4gICAgICAgICAgICAgICAgLmRhdGEob3JpZ2luYWxPcHRpb25zLm5vZGVzKCkpXG4gICAgICAgICAgICAgICAgLnByb3BlcnR5KCdjaGVja2VkJywgZCA9PiBkLnNlbGVjdGVkKTtcbiAgICAgICAgfVxuICAgIH07XG59IiwiaW1wb3J0ICogYXMgZDMgZnJvbSAnLi4vZDMnO1xuXG5pbXBvcnQgeyBCYXNlQ29tcG9uZW50IH0gZnJvbSAnLi9iYXNlLWNvbXBvbmVudCc7XG5pbXBvcnQgeyBEaXNwYXRjaCwgRGlzcGF0Y2hFdmVudCwgTG9hZEV2ZW50RGF0YSwgU2VsZWN0RXZlbnREYXRhLCBIaWdobGlnaHRFdmVudERhdGEsIEZpbHRlckV2ZW50RGF0YSB9IGZyb20gJy4uL2RhdGEvZGlzcGF0Y2gnO1xuaW1wb3J0IHsgQXR0cmlidXRlIH0gZnJvbSAnLi4vZGF0YS9hdHRyaWJ1dGUnO1xuaW1wb3J0IHsgTGlzdGluZywgTmVpZ2hib3Job29kIH0gZnJvbSAnLi4vZGF0YS9saXN0aW5nJztcbmltcG9ydCB7IEJsb2NrIH0gZnJvbSAnLi4vZGF0YS9ibG9jayc7XG5cbmltcG9ydCB7IENoZWNrYm94TXVsdGlzZWxlY3QgfSBmcm9tICcuLi91dGlsL2NoZWNrYm94LW11bHRpc2VsZWN0JztcblxuZXhwb3J0IGNsYXNzIEZpbHRlcnNDb21wb25lbnQgZXh0ZW5kcyBCYXNlQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgdmlldzoge1xuICAgICAgICBuZWlnaGJvcmhvb2RGaWx0ZXJMaXN0PzogZDMuRGF0YVNlbGVjdGlvbjxOZWlnaGJvcmhvb2Q+O1xuICAgICAgICBwcmljZUJsb2Nrc0ZpbHRlckxpc3Q/OiBkMy5EYXRhU2VsZWN0aW9uPEJsb2NrPjtcbiAgICAgICAgbWFya3VwQmxvY2tzRmlsdGVyTGlzdD86IGQzLkRhdGFTZWxlY3Rpb248QmxvY2s+O1xuICAgICAgICBhbWVuaXRpZXNGaWx0ZXJMaXN0PzogZDMuRGF0YVNlbGVjdGlvbjxzdHJpbmc+O1xuXG4gICAgICAgIG5laWdoYm9yaG9vZE11bHRpc2VsZWN0PzogQ2hlY2tib3hNdWx0aXNlbGVjdDtcbiAgICAgICAgcHJpY2VCbG9ja3NNdWx0aXNlbGVjdD86IENoZWNrYm94TXVsdGlzZWxlY3Q7XG4gICAgICAgIG1hcmt1cEJsb2Nrc011bHRpc2VsZWN0PzogQ2hlY2tib3hNdWx0aXNlbGVjdDtcbiAgICAgICAgYW1lbml0aWVzTXVsdGlzZWxlY3Q/OiBDaGVja2JveE11bHRpc2VsZWN0O1xuXG4gICAgICAgIGxpbmtzPzogZDMuRGF0YWxlc3NTZWxlY3Rpb247XG4gICAgfVxuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHNlbGVjdG9yOiBzdHJpbmcsIGRpc3BhdGNoZXI6IERpc3BhdGNoKSB7XG4gICAgICAgIHN1cGVyKHNlbGVjdG9yLCBkaXNwYXRjaGVyKTtcblxuICAgICAgICB0aGlzLnZpZXcgPSB7fTtcbiAgICAgICAgdGhpcy52aWV3LmxpbmtzID0gZDMuc2VsZWN0KHRoaXMuZWxlbWVudC5wYXJlbnRFbGVtZW50KS5zZWxlY3QoJy5maWx0ZXItbGlua3MnKTtcbiAgICAgICAgdGhpcy52aWV3LmxpbmtzXG4gICAgICAgICAgICAuc2VsZWN0KCdhLnJlc2V0JylcbiAgICAgICAgICAgIC5vbignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmNhbGwoRGlzcGF0Y2hFdmVudC5GaWx0ZXIsIHRoaXMsIERpc3BhdGNoLmVtcHR5RmlsdGVyKCkpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSAgXG5cbiAgICBwdWJsaWMgb25Mb2FkKGRhdGE6IExvYWRFdmVudERhdGEpIHtcbiAgICAgICAgc3VwZXIub25Mb2FkKGRhdGEpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkZpbHRlcihmaWx0ZXI6IEZpbHRlckV2ZW50RGF0YSkge1xuICAgICAgICBzdXBlci5vbkZpbHRlcihmaWx0ZXIpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgZmlsdGVyIGxpc3RzIHdpdGggdGhlIGNob3NlbiBmaWx0ZXJcbiAgICAgICAgdGhpcy52aWV3Lm5laWdoYm9yaG9vZEZpbHRlckxpc3QucHJvcGVydHkoJ3NlbGVjdGVkJywgZCA9PiBmaWx0ZXIubmVpZ2hib3Job29kcy5pbmRleE9mKGQpICE9PSAtMSk7XG4gICAgICAgIHRoaXMudmlldy5wcmljZUJsb2Nrc0ZpbHRlckxpc3QucHJvcGVydHkoJ3NlbGVjdGVkJywgZCA9PiBmaWx0ZXIucHJpY2VCbG9ja3MuaW5kZXhPZihkKSAhPT0gLTEpO1xuICAgICAgICB0aGlzLnZpZXcubWFya3VwQmxvY2tzRmlsdGVyTGlzdC5wcm9wZXJ0eSgnc2VsZWN0ZWQnLCBkID0+IGZpbHRlci5tYXJrdXBCbG9ja3MuaW5kZXhPZihkKSAhPT0gLTEpO1xuICAgICAgICB0aGlzLnZpZXcuYW1lbml0aWVzRmlsdGVyTGlzdC5wcm9wZXJ0eSgnc2VsZWN0ZWQnLCBkID0+IGZpbHRlci5hbWVuaXRpZXMuaW5kZXhPZihkKSAhPT0gLTEpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbXVsdGlzZWxlY3RzXG4gICAgICAgIHRoaXMudmlldy5uZWlnaGJvcmhvb2RNdWx0aXNlbGVjdC51cGRhdGUoZmlsdGVyLm5laWdoYm9yaG9vZHMubGVuZ3RoICsgJyBuZWlnaGJvcmhvb2RzJyk7XG4gICAgICAgIHRoaXMudmlldy5wcmljZUJsb2Nrc011bHRpc2VsZWN0LnVwZGF0ZShmaWx0ZXIucHJpY2VCbG9ja3MubGVuZ3RoICsgJyBwcmljZSBibG9ja3MnKTtcbiAgICAgICAgdGhpcy52aWV3Lm1hcmt1cEJsb2Nrc011bHRpc2VsZWN0LnVwZGF0ZShmaWx0ZXIubWFya3VwQmxvY2tzLmxlbmd0aCArICcgbWFya3VwIGJsb2NrcycpO1xuICAgICAgICB0aGlzLnZpZXcuYW1lbml0aWVzTXVsdGlzZWxlY3QudXBkYXRlKGZpbHRlci5hbWVuaXRpZXMubGVuZ3RoICsgJyBhbWVuaXRpZXMnKTtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHJlc2V0IGxpbmtcbiAgICAgICAgdGhpcy5yZW5kZXJGaWx0ZXJMaW5rcygpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXNpemUoKSB7XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlck5laWdoYm9yaG9vZHMoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgICAgICBsZXQgZmlsdGVyU2VsZWN0ID0gZDMuc2VsZWN0KHRoaXMuc2VsZWN0b3IpLnNlbGVjdCgnLmZpbHRlci1uZWlnaGJvcmhvb2RzJylcbiAgICAgICAgXG5cbiAgICAgICAgbGV0IG5laWdoYm9yaG9vZHMgPSBBcnJheS5mcm9tKHRoaXMuZGF0YS5uZWlnaGJvcmhvb2RzLnZhbHVlcygpKS5zb3J0KGZ1bmN0aW9uKGEsYil7XG4gICAgICAgICAgICBpZihhLm5hbWUgPCBiLm5hbWUpIHJldHVybiAtMTtcbiAgICAgICAgICAgIGlmKGEubmFtZSA+IGIubmFtZSkgcmV0dXJuIDE7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIGxldCBmaWx0ZXJPcHRpb25zID0gZmlsdGVyU2VsZWN0XG4gICAgICAgICAgLnNlbGVjdEFsbCgnb3B0aW9uLmNob2ljZScpXG4gICAgICAgICAgICAuZGF0YShuZWlnaGJvcmhvb2RzLCAoZDogTmVpZ2hib3Job29kKSA9PiBkLm5hbWUpO1xuXG4gICAgICAgIGxldCBmaWx0ZXJPcHRpb25zRW50ZXIgPSBmaWx0ZXJPcHRpb25zXG4gICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdvcHRpb24nKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2Nob2ljZScpXG4gICAgICAgICAgICAudGV4dChkID0+IGQubmFtZSk7XG5cbiAgICAgICAgdGhpcy52aWV3Lm5laWdoYm9yaG9vZEZpbHRlckxpc3QgPSBmaWx0ZXJPcHRpb25zLm1lcmdlKGZpbHRlck9wdGlvbnNFbnRlcik7XG5cbiAgICAgICAgZmlsdGVyU2VsZWN0Lm9uKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWROZWlnaGJvcmhvb2RzID0gdGhpcy52aWV3Lm5laWdoYm9yaG9vZEZpbHRlckxpc3RcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHRoaXNbJ3NlbGVjdGVkJ107IH0pXG4gICAgICAgICAgICAgICAgLmRhdGEoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmNhbGwoRGlzcGF0Y2hFdmVudC5TZWxlY3QsIHRoaXMsIERpc3BhdGNoLmVtcHR5U2VsZWN0aW9uKCkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaE5laWdoYm9yaG9vZEZpbHRlcihzZWxlY3RlZE5laWdoYm9yaG9vZHMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlclByaWNlQmxvY2tzKCkge1xuICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICBsZXQgZmlsdGVyU2VsZWN0ID0gZDMuc2VsZWN0KHRoaXMuc2VsZWN0b3IpLnNlbGVjdCgnLmZpbHRlci1wcmljZS1ibG9ja3MnKTtcblxuICAgICAgICBsZXQgZmlsdGVyT3B0aW9ucyA9IGZpbHRlclNlbGVjdFxuICAgICAgICAgIC5zZWxlY3RBbGwoJ29wdGlvbi5jaG9pY2UnKVxuICAgICAgICAgICAgLmRhdGEodGhpcy5kYXRhLnByaWNlQmxvY2tzLCAoZDogQmxvY2spID0+IGQubnVtYmVyICsgJycpO1xuXG4gICAgICAgIGxldCBmaWx0ZXJPcHRpb25zRW50ZXIgPSBmaWx0ZXJPcHRpb25zXG4gICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdvcHRpb24nKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2Nob2ljZScpXG4gICAgICAgICAgICAudGV4dChkID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgbGFiZWwgPSAnJCcgKyBkLm1pbmltdW0udG9GaXhlZCgwKTtcblxuICAgICAgICAgICAgICAgIGlmIChpc05hTihkLm1heGltdW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsICs9ICcrJztcbiAgICAgICAgICAgICAgICB9IFxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCArPSAnIC0gJCcgKyBkLm1heGltdW0udG9GaXhlZCgwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbGFiZWw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnZpZXcucHJpY2VCbG9ja3NGaWx0ZXJMaXN0ID0gZmlsdGVyT3B0aW9ucy5tZXJnZShmaWx0ZXJPcHRpb25zRW50ZXIpO1xuXG4gICAgICAgIGZpbHRlclNlbGVjdC5vbignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHNlbGVjdGVkUHJpY2VCbG9ja3MgPSB0aGlzLnZpZXcucHJpY2VCbG9ja3NGaWx0ZXJMaXN0XG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbihkKSB7IHJldHVybiB0aGlzWydzZWxlY3RlZCddOyB9KVxuICAgICAgICAgICAgICAgIC5kYXRhKCk7XG5cbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKERpc3BhdGNoRXZlbnQuU2VsZWN0LCB0aGlzLCBEaXNwYXRjaC5lbXB0eVNlbGVjdGlvbigpKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hQcmljZUJsb2NrRmlsdGVyKHNlbGVjdGVkUHJpY2VCbG9ja3MpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlck1hcmt1cEJsb2NrcygpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgbGV0IGZpbHRlclNlbGVjdCA9IGQzLnNlbGVjdCh0aGlzLnNlbGVjdG9yKS5zZWxlY3QoJy5maWx0ZXItbWFya3VwLWJsb2NrcycpO1xuXG4gICAgICAgIGxldCBmaWx0ZXJPcHRpb25zID0gZmlsdGVyU2VsZWN0XG4gICAgICAgICAgLnNlbGVjdEFsbCgnb3B0aW9uLmNob2ljZScpXG4gICAgICAgICAgICAuZGF0YSh0aGlzLmRhdGEubWFya3VwQmxvY2tzLCAoZDogQmxvY2spID0+IGQubnVtYmVyICsgJycpO1xuXG4gICAgICAgIGxldCBmaWx0ZXJPcHRpb25zRW50ZXIgPSBmaWx0ZXJPcHRpb25zXG4gICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdvcHRpb24nKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2Nob2ljZScpXG4gICAgICAgICAgICAudGV4dChkID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgbGFiZWwgPSBkLm1pbmltdW0udG9GaXhlZCgwKTtcblxuICAgICAgICAgICAgICAgIGlmIChpc05hTihkLm1heGltdW0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsICs9ICcrJSc7XG4gICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgKz0gJyUgLSAnICsgZC5tYXhpbXVtLnRvRml4ZWQoMCkgKyAnJSc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhYmVsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy52aWV3Lm1hcmt1cEJsb2Nrc0ZpbHRlckxpc3QgPSBmaWx0ZXJPcHRpb25zLm1lcmdlKGZpbHRlck9wdGlvbnNFbnRlcik7XG5cbiAgICAgICAgZmlsdGVyU2VsZWN0Lm9uKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWRNYXJrdXBCbG9ja3MgPSB0aGlzLnZpZXcubWFya3VwQmxvY2tzRmlsdGVyTGlzdFxuICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gdGhpc1snc2VsZWN0ZWQnXTsgfSlcbiAgICAgICAgICAgICAgICAuZGF0YSgpO1xuXG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoZXIuY2FsbChEaXNwYXRjaEV2ZW50LlNlbGVjdCwgdGhpcywgRGlzcGF0Y2guZW1wdHlTZWxlY3Rpb24oKSk7XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoTWFya3VwQmxvY2tGaWx0ZXIoc2VsZWN0ZWRNYXJrdXBCbG9ja3MpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbmRlckFtZW5pdGllcygpIHtcbiAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgbGV0IGZpbHRlclNlbGVjdCA9IGQzLnNlbGVjdCh0aGlzLnNlbGVjdG9yKS5zZWxlY3QoJy5maWx0ZXItYW1lbml0aWVzJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgbGV0IGZpbHRlck9wdGlvbnMgPSBmaWx0ZXJTZWxlY3RcbiAgICAgICAgICAuc2VsZWN0QWxsKCdvcHRpb24uY2hvaWNlJylcbiAgICAgICAgICAgIC5kYXRhKHRoaXMuZGF0YS5hbWVuaXRpZXMsIChhbWVuaXR5OiBzdHJpbmcpID0+IGFtZW5pdHkpO1xuXG4gICAgICAgIGxldCBmaWx0ZXJPcHRpb25zRW50ZXIgPSBmaWx0ZXJPcHRpb25zXG4gICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAuYXBwZW5kKCdvcHRpb24nKVxuICAgICAgICAgICAgLmF0dHIoJ2NsYXNzJywgJ2Nob2ljZScpXG4gICAgICAgICAgICAudGV4dChkID0+IGQpO1xuXG4gICAgICAgIHRoaXMudmlldy5hbWVuaXRpZXNGaWx0ZXJMaXN0ID0gZmlsdGVyT3B0aW9ucy5tZXJnZShmaWx0ZXJPcHRpb25zRW50ZXIpO1xuXG4gICAgICAgIGZpbHRlclNlbGVjdC5vbignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgbGV0IHNlbGVjdGVkQW1lbml0aWVzID0gdGhpcy52aWV3LmFtZW5pdGllc0ZpbHRlckxpc3RcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHRoaXNbJ3NlbGVjdGVkJ107IH0pXG4gICAgICAgICAgICAgICAgLmRhdGEoKTtcblxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaGVyLmNhbGwoRGlzcGF0Y2hFdmVudC5TZWxlY3QsIHRoaXMsIERpc3BhdGNoLmVtcHR5U2VsZWN0aW9uKCkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEFtZW5pdHlGaWx0ZXIoc2VsZWN0ZWRBbWVuaXRpZXMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyRmlsdGVyTGlua3MoKSB7XG4gICAgICAgIGlmIChEaXNwYXRjaC5pc0VtcHR5RmlsdGVyKHRoaXMuZmlsdGVyKSkge1xuICAgICAgICAgICAgdGhpcy52aWV3LmxpbmtzLnN0eWxlKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5saW5rcy5zdHlsZSgnZGlzcGxheScsICdpbmxpbmUtYmxvY2snKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICAgIGxldCBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLnJlbmRlck5laWdoYm9yaG9vZHMoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJQcmljZUJsb2NrcygpO1xuICAgICAgICB0aGlzLnJlbmRlck1hcmt1cEJsb2NrcygpO1xuICAgICAgICB0aGlzLnJlbmRlckFtZW5pdGllcygpO1xuICAgICAgICB0aGlzLnJlbmRlckZpbHRlckxpbmtzKCk7XG5cbiAgICAgICAgLy8gUnVuIHRoZSBjaGVja2JveC1tdWx0aXNlbGVjdCBwbHVnaW4gb24gdGhlIHNlbGVjdHNcbiAgICAgICAgdGhpcy52aWV3Lm5laWdoYm9yaG9vZE11bHRpc2VsZWN0ID0gQ2hlY2tib3hNdWx0aXNlbGVjdCh0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRlci1uZWlnaGJvcmhvb2RzJykgYXMgSFRNTFNlbGVjdEVsZW1lbnQsICcwIG5laWdoYm9yaG9vZHMnKTtcbiAgICAgICAgdGhpcy52aWV3LnByaWNlQmxvY2tzTXVsdGlzZWxlY3QgPSBDaGVja2JveE11bHRpc2VsZWN0KHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuZmlsdGVyLXByaWNlLWJsb2NrcycpIGFzIEhUTUxTZWxlY3RFbGVtZW50LCAnMCBwcmljZSBibG9ja3MnKTtcbiAgICAgICAgdGhpcy52aWV3Lm1hcmt1cEJsb2Nrc011bHRpc2VsZWN0ID0gQ2hlY2tib3hNdWx0aXNlbGVjdCh0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRlci1tYXJrdXAtYmxvY2tzJykgYXMgSFRNTFNlbGVjdEVsZW1lbnQsICcwIG1hcmt1cCBibG9ja3MnKTtcbiAgICAgICAgdGhpcy52aWV3LmFtZW5pdGllc011bHRpc2VsZWN0ID0gQ2hlY2tib3hNdWx0aXNlbGVjdCh0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvcignLmZpbHRlci1hbWVuaXRpZXMnKSBhcyBIVE1MU2VsZWN0RWxlbWVudCwgJzAgYW1lbml0aWVzJyk7XG4gICAgfVxufSAiLCJpbXBvcnQgKiBhcyBkMyBmcm9tICcuL2QzJztcblxuaW1wb3J0IHsgRGlzcGF0Y2gsIERpc3BhdGNoRXZlbnQsIExvYWRFdmVudERhdGEgfSBmcm9tICcuL2RhdGEvZGlzcGF0Y2gnO1xuaW1wb3J0IHsgTmVpZ2hib3Job29kR2VvSlNPTiB9IGZyb20gJy4vZGF0YS9nZW9qc29uJztcbmltcG9ydCB7IExpc3RpbmcsIE5laWdoYm9yaG9vZCB9IGZyb20gJy4vZGF0YS9saXN0aW5nJztcbmltcG9ydCB7IEJsb2NrIH0gZnJvbSAnLi9kYXRhL2Jsb2NrJztcblxuaW1wb3J0ICogYXMgY29tcG9uZW50cyBmcm9tICcuL2NvbXBvbmVudHMvJztcblxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uIHtcbiAgICBwcml2YXRlIGRpc3BhdGNoZXI6IERpc3BhdGNoO1xuXG4gICAgLy8gQ29tcG9uZW50c1xuICAgIHByaXZhdGUgbWFwQ29tcG9uZW50OiBjb21wb25lbnRzLk5laWdoYm9yaG9vZE1hcENvbXBvbmVudDtcbiAgICBwcml2YXRlIGJsb2Nrc0NvbXBvbmVudDogY29tcG9uZW50cy5MaXN0aW5nQmxvY2tzQ29tcG9uZW50O1xuICAgIHByaXZhdGUgc2NhdHRlclBsb3RDb21wb25lbnQ6IGNvbXBvbmVudHMuU2NhdHRlclBsb3RDb21wb25lbnQ7XG4gICAgcHJpdmF0ZSBkZXRhaWxDb21wb25lbnQ6IGNvbXBvbmVudHMuRGV0YWlsQ29tcG9uZW50O1xuICAgIHByaXZhdGUgc2VsZWN0aW9uQ29tcG9uZW50OiBjb21wb25lbnRzLlNlbGVjdGlvbkNvbXBvbmVudDtcbiAgICBwcml2YXRlIGZpbHRlcnNDb21wb25lbnQ6IGNvbXBvbmVudHMuRmlsdGVyc0NvbXBvbmVudDtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBkaXNwYXRjaGVyXG4gICAgICAgIHRoaXMuZGlzcGF0Y2hlciA9IGQzLmRpc3BhdGNoKERpc3BhdGNoRXZlbnQuTG9hZCwgRGlzcGF0Y2hFdmVudC5TZWxlY3QsIERpc3BhdGNoRXZlbnQuSGlnaGxpZ2h0LCBEaXNwYXRjaEV2ZW50LkZpbHRlcik7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBjb21wb25lbnRzXG4gICAgICAgIHRoaXMubWFwQ29tcG9uZW50ID0gbmV3IGNvbXBvbmVudHMuTmVpZ2hib3Job29kTWFwQ29tcG9uZW50KCcjbWFwIC5jb250ZW50JywgdGhpcy5kaXNwYXRjaGVyKTtcbiAgICAgICAgdGhpcy5ibG9ja3NDb21wb25lbnQgPSBuZXcgY29tcG9uZW50cy5MaXN0aW5nQmxvY2tzQ29tcG9uZW50KCcjbGlzdGluZy1ibG9ja3MgLmNvbnRlbnQnLCB0aGlzLmRpc3BhdGNoZXIpO1xuICAgICAgICB0aGlzLnNjYXR0ZXJQbG90Q29tcG9uZW50ID0gbmV3IGNvbXBvbmVudHMuU2NhdHRlclBsb3RDb21wb25lbnQoJyNzY2F0dGVyLXBsb3QgLmNvbnRlbnQnLCB0aGlzLmRpc3BhdGNoZXIpO1xuICAgICAgICB0aGlzLmRldGFpbENvbXBvbmVudCA9IG5ldyBjb21wb25lbnRzLkRldGFpbENvbXBvbmVudCgnI2RldGFpbHMgLmNvbnRlbnQnLCB0aGlzLmRpc3BhdGNoZXIpO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbkNvbXBvbmVudCA9IG5ldyBjb21wb25lbnRzLlNlbGVjdGlvbkNvbXBvbmVudCgnI3NlbGVjdGlvbiAuY29udGVudCcsIHRoaXMuZGlzcGF0Y2hlcik7XG4gICAgICAgIHRoaXMuZmlsdGVyc0NvbXBvbmVudCA9IG5ldyBjb21wb25lbnRzLkZpbHRlcnNDb21wb25lbnQoJyNmaWx0ZXJzIC5jb250ZW50JywgdGhpcy5kaXNwYXRjaGVyKTtcblxuICAgICAgICAvLyBCZWdpbiBsb2FkaW5nXG4gICAgICAgIHRoaXMubG9hZERhdGEoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRpYWxpemVCbG9ja3MobGlzdGluZ3M6IE1hcDxMaXN0aW5nLklEVHlwZSwgTGlzdGluZz4pIHtcbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB0aGUgcHJpY2UgYmxvY2sgcmFuZ2VzXG4gICAgICAgIGxldCBwcmljZVJhbmdlcyA9IFswLCAxMDAsIDIwMCwgMzAwLCA0MDAsIDUwMCwgNjAwLCA3MDAsIDgwMCwgOTAwLCAxMDAwLCAyMDAwXTtcbiAgICAgICAgbGV0IG1hcmt1cFJhbmdlcyA9IFstMTAwLCAwLCA1MCwgMTAwLCAxNTAsIDIwMCwgMjUwLCAzMDAsIDQwMCwgNTAwXTtcblxuICAgICAgICBsZXQgcHJpY2VCbG9ja3M6IEJsb2NrW10gPSBbXTtcbiAgICAgICAgbGV0IG1hcmt1cEJsb2NrczogQmxvY2tbXSA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJpY2VSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHByaWNlQmxvY2tzLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwicHJpY2VcIixcbiAgICAgICAgICAgICAgICBudW1iZXI6IGksXG4gICAgICAgICAgICAgICAgbWluaW11bTogcHJpY2VSYW5nZXNbaV0sXG4gICAgICAgICAgICAgICAgbWF4aW11bTogKGkgPT09IHByaWNlUmFuZ2VzLmxlbmd0aCAtIDEpID8gTmFOIDogcHJpY2VSYW5nZXNbaSsxXSxcbiAgICAgICAgICAgICAgICBsaXN0aW5nczogW11cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXJrdXBSYW5nZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG1hcmt1cEJsb2Nrcy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm1hcmt1cFwiLFxuICAgICAgICAgICAgICAgIG51bWJlcjogaSxcbiAgICAgICAgICAgICAgICBtaW5pbXVtOiBtYXJrdXBSYW5nZXNbaV0sXG4gICAgICAgICAgICAgICAgbWF4aW11bTogKGkgPT09IG1hcmt1cFJhbmdlcy5sZW5ndGggLSAxKSA/IE5hTiA6IG1hcmt1cFJhbmdlc1tpKzFdLFxuICAgICAgICAgICAgICAgIGxpc3RpbmdzOiBbXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbml0aWFsaXplIHRoZSBibG9ja3MgZm9yIHRoZSBsaXN0aW5nc1xuICAgICAgICBmb3IgKGxldCBsaXN0aW5nIG9mIEFycmF5LmZyb20obGlzdGluZ3MudmFsdWVzKCkpKSB7XG4gICAgICAgICAgICBsZXQgcHJpY2UgPSBsaXN0aW5nLnByaWNlcy5haXJibmIuZGFpbHk7XG4gICAgICAgICAgICBsZXQgbWFya3VwID0gbGlzdGluZy5wcmljZXMubWFya3VwX3BlcmNlbnRhZ2U7XG5cbiAgICAgICAgICAgIC8vIEZpbmQgdGhlIHJpZ2h0IHByaWNlIGFuZCBtYXJrdXAgYmxvY2sgZm9yIHRoaXMgbGlzdGluZ1xuICAgICAgICAgICAgZm9yIChsZXQgYmxvY2sgb2YgcHJpY2VCbG9ja3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoQmxvY2suY29udGFpbnMoYmxvY2ssIGxpc3RpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJsb2NrLmxpc3RpbmdzLnB1c2gobGlzdGluZyk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RpbmcucHJpY2VCbG9jayA9IGJsb2NrO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAobGV0IGJsb2NrIG9mIG1hcmt1cEJsb2Nrcykge1xuICAgICAgICAgICAgICAgIGlmIChCbG9jay5jb250YWlucyhibG9jaywgbGlzdGluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgYmxvY2subGlzdGluZ3MucHVzaChsaXN0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGluZy5tYXJrdXBCbG9jayA9IGJsb2NrO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHByaWNlIGFuZCBtYXJrdXAgYmxvY2tzIHdpdGggaW5mb3JtYXRpb24gYWJvdXQgd2hlcmUgdGhleSBzdGFydCByZWxhdGl2ZSB0byBvbmUgYW5vdGhlclxuICAgICAgICBwcmljZUJsb2Nrcy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBibG9jaykgPT4ge1xuICAgICAgICAgICAgYmxvY2subGlzdGluZ3NTdGFydEluZGV4ID0gYWNjdW11bGF0b3I7XG4gICAgICAgICAgICByZXR1cm4gYWNjdW11bGF0b3IgKyBibG9jay5saXN0aW5ncy5sZW5ndGg7XG4gICAgICAgIH0sIDApO1xuXG4gICAgICAgIG1hcmt1cEJsb2Nrcy5yZWR1Y2UoKGFjY3VtdWxhdG9yLCBibG9jaykgPT4ge1xuICAgICAgICAgICAgYmxvY2subGlzdGluZ3NTdGFydEluZGV4ID0gYWNjdW11bGF0b3I7XG4gICAgICAgICAgICByZXR1cm4gYWNjdW11bGF0b3IgKyBibG9jay5saXN0aW5ncy5sZW5ndGg7XG4gICAgICAgIH0sIDApO1xuXG4gICAgICAgIC8vIFNvcnQgdGhlIGxpc3RpbmdzIHdpdGhpbiBlYWNoIGJsb2NrXG4gICAgICAgIGZvciAobGV0IGJsb2NrIG9mIHByaWNlQmxvY2tzKSB7XG4gICAgICAgICAgICBibG9jay5saXN0aW5ncy5zb3J0KChhLGIpID0+IGEucHJpY2VzLmFpcmJuYi5kYWlseSAtIGIucHJpY2VzLmFpcmJuYi5kYWlseSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBibG9jayBvZiBtYXJrdXBCbG9ja3MpIHtcbiAgICAgICAgICAgIGJsb2NrLmxpc3RpbmdzLnNvcnQoKGEsYikgPT4gYS5wcmljZXMubWFya3VwX3BlcmNlbnRhZ2UgLSBiLnByaWNlcy5tYXJrdXBfcGVyY2VudGFnZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW3ByaWNlQmxvY2tzLCBtYXJrdXBCbG9ja3NdO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZUFtZW5pdGllcyhsaXN0aW5nczogTWFwPExpc3RpbmcuSURUeXBlLCBMaXN0aW5nPikgOiBzdHJpbmdbXSB7XG4gICAgICAgIC8vIENyZWF0ZSB0aGUgYW1lbml0aWVzIG1hcCBmcm9tIHRoZSBkYXRhIHNldFxuICAgICAgICBsZXQgYW1lbml0aWVzRnJlcXVlbmN5ID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgICAgICAgZm9yIChsZXQgbGlzdGluZyBvZiBBcnJheS5mcm9tKGxpc3RpbmdzLnZhbHVlcygpKSkge1xuICAgICAgICAgICAgZm9yIChsZXQgYW1lbml0eSBvZiBsaXN0aW5nLmFtZW5pdGllcykge1xuICAgICAgICAgICAgICAgIGxldCBjb3VudCA9IGFtZW5pdGllc0ZyZXF1ZW5jeS5nZXQoYW1lbml0eSk7XG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgYW1lbml0eSB3YXNuJ3QgeWV0IHNlZW4gaW4gdGhpcyBtYXBcbiAgICAgICAgICAgICAgICBpZiAoY291bnQgPT09IHVuZGVmaW5lZCkgXG4gICAgICAgICAgICAgICAgICAgIGFtZW5pdGllc0ZyZXF1ZW5jeS5zZXQoYW1lbml0eSwgMSk7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBhbWVuaXRpZXNGcmVxdWVuY3kuc2V0KGFtZW5pdHksIGNvdW50ICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGVhbiB1cCBvdXIgbGlzdCBvZiBhbWVuaXRpZXM6XG4gICAgICAgIC8vICAgLSBHZXQgdGhlIGxpc3Qgb2YgYW1lbml0aWVzIGZyb20gb3VyIGNhbGN1bGF0ZWQgbWFwXG4gICAgICAgIC8vICAgLSBTb3J0IHRoZSBhbWVuaXRpZXMgYnkgY291bnQgb2YgbGlzdGluZ3MgdGhhdCBoYXZlIHRoZW1cbiAgICAgICAgLy8gICAtIEZpbHRlciBvdXQgdGhlIGFtZW5pdGllcyB0aGF0IHNheSAndHJhbnNsYXRpb24gbWlzc2luZycgKHdoeSBkbyB0aGVzZSBleGlzdD8pXG4gICAgICAgIC8vICAgLSBUYWtlIHRoZSBmaXJzdCBvZiB0aGVzZSAzNSBhbWVuaXRpZXNcbiAgICAgICAgcmV0dXJuIEFycmF5XG4gICAgICAgICAgICAuZnJvbShhbWVuaXRpZXNGcmVxdWVuY3kuZW50cmllcygpKSBcbiAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBiWzFdIC0gYVsxXSlcbiAgICAgICAgICAgIC5maWx0ZXIoKFthbWVuaXR5LCBjb3VudF0pID0+IGFtZW5pdHkuaW5kZXhPZigndHJhbnNsYXRpb24gbWlzc2luZycpID09PSAtMSlcbiAgICAgICAgICAgIC5zbGljZSgwLCAzNSlcbiAgICAgICAgICAgIC5tYXAoKFthbWVuaXR5LCBjb3VudF0pID0+IGFtZW5pdHkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgbG9hZERhdGEoKSB7XG4gICAgICAgIGxldCBuZWlnaGJvcmhvb2RzID0gbmV3IE1hcDxOZWlnaGJvcmhvb2QuTmFtZVR5cGUsIE5laWdoYm9yaG9vZD4oKTtcbiAgICAgICAgbGV0IGxpc3RpbmdzID0gbmV3IE1hcDxMaXN0aW5nLklEVHlwZSwgTGlzdGluZz4oKTtcblxuICAgICAgICAvLyBMb2FkIHRoZSBuZWlnaGJvcmhvb2QgSlNPTiBhbmQgbGlzdGluZ3MgSlNPTlxuICAgICAgICBkMy5qc29uKCdkYXRhL25laWdoYm9yaG9vZHMuZ2VvanNvbicsIChlcnJvciwgZ2VvOiBOZWlnaGJvcmhvb2RHZW9KU09OKSA9PiB7XG4gICAgICAgICAgICBkMy5jc3YoXG4gICAgICAgICAgICAgICAgJ2RhdGEvbGlzdGluZ3MuY3N2JywgXG4gICAgICAgICAgICAgICAgKGVycm9yLCBkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFByb2Nlc3MgdGhlIGxpc3RpbmcgZGF0YVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCByb3cgb2YgZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBuZWlnaGJvcmhvb2QgZm9yIHRoaXMgbGlzdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5laWdoYm9yaG9vZCA9IG5laWdoYm9yaG9vZHMuZ2V0KHJvd1snbmVpZ2hib3VyaG9vZF9jbGVhbnNlZCddKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlIG5laWdoYm9yaG9vZCBkb2VzIG5vdCB5ZXQgZXhpc3QsIGNyZWF0ZSBpdFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5laWdoYm9yaG9vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmVpZ2hib3Job29kID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiByb3dbJ25laWdoYm91cmhvb2RfY2xlYW5zZWQnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGluZ3M6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2RzLnNldChuZWlnaGJvcmhvb2QubmFtZSwgbmVpZ2hib3Job29kKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIG91ciBjdXJyZW50IGxpc3RpbmcgYW5kIGFkZCBpdCB0byB0aGUgYXJyYXkgYW5kIHRoZSByaWdodCBuZWlnaGJvcmhvb2RcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsaXN0aW5nID0gTGlzdGluZy5wYXJzZUNTVlJvdyhyb3csIG5laWdoYm9yaG9vZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2QubGlzdGluZ3MucHVzaChsaXN0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RpbmdzLnNldChsaXN0aW5nLmlkLCBsaXN0aW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIFByb2Nlc3MgdGhlIGJsb2Nrc1xuICAgICAgICAgICAgICAgICAgICBsZXQgW3ByaWNlQmxvY2tzLCBtYXJrdXBCbG9ja3NdID0gdGhpcy5pbml0aWFsaXplQmxvY2tzKGxpc3RpbmdzKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIG1vc3QgcG9wdWxhciBhbWVuaXRpZXNcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFtZW5pdGllcyA9IHRoaXMuaW5pdGlhbGl6ZUFtZW5pdGllcyhsaXN0aW5ncyk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IGxvYWREYXRhOiBMb2FkRXZlbnREYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2VvOiBnZW8sXG4gICAgICAgICAgICAgICAgICAgICAgICBuZWlnaGJvcmhvb2RzOiBuZWlnaGJvcmhvb2RzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGluZ3M6IGxpc3RpbmdzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJpY2VCbG9ja3M6IHByaWNlQmxvY2tzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWFya3VwQmxvY2tzOiBtYXJrdXBCbG9ja3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBhbWVuaXRpZXM6IGFtZW5pdGllc1xuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hlci5jYWxsKERpc3BhdGNoRXZlbnQuTG9hZCwgdW5kZWZpbmVkLCBsb2FkRGF0YSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICB9XG59IiwiZXhwb3J0IGZ1bmN0aW9uIEhlbHBWaWV3KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgbGV0IHZpZXdVcmwgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1oZWxwLXZpZXcnKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IGEgdGVtcGxhdGUgdmlldyBVUkwgZXhpc3RzIGZvciB0aGlzXG4gICAgaWYgKCF2aWV3VXJsKVxuICAgICAgICByZXR1cm47XG5cbiAgICAvLyBGZXRjaCB0aGUgdGVtcGxhdGUgdmlldyBhbmQgc3RvcmUgaXQgaW4gYSB0ZW1wbGF0ZSBmb3IgbGF0ZXIgdXNlXG4gICAgZmV0Y2godmlld1VybClcbiAgICAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UudGV4dCgpKVxuICAgICAgICAudGhlbih0ZXh0ID0+IHtcbiAgICAgICAgICAgIGxldCBoZWxwVmlldyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgaGVscFZpZXcuY2xhc3NOYW1lID0gJ2hlbHAtdmlldyc7XG4gICAgICAgICAgICBoZWxwVmlldy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgaGVscFZpZXcuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJpbm5lclwiPicgKyB0ZXh0ICsgJzwvZGl2Pic7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGhlbHBWaWV3KTtcblxuICAgICAgICAgICAgbGV0IHZpZXdTaG91bGRTdGF5VmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBTaG93IGFuZCBoaWRlIHRoZSBoZWxwIHZpZXcgXG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBGaXJzdCBzaG93IHRoZSB2aWV3IHRvIGNvbXB1dGUgaXRzIGRpbWVuc2lvbnNcbiAgICAgICAgICAgICAgICBoZWxwVmlldy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcblxuICAgICAgICAgICAgICAgIGxldCBzb3VyY2VCb3ggPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgIGxldCB2aWV3Qm94ID0gaGVscFZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAgICAgICBsZXQgaG9yaXpvbnRhbDogJ2xlZnQnfCdyaWdodCc7XG4gICAgICAgICAgICAgICAgbGV0IHZlcnRpY2FsOiAndG9wJ3wnYm90dG9tJztcblxuICAgICAgICAgICAgICAgIGlmIChzb3VyY2VCb3gubGVmdCArIHZpZXdCb3gud2lkdGggPCB3aW5kb3cuaW5uZXJXaWR0aCkge1xuICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsID0gJ2xlZnQnO1xuICAgICAgICAgICAgICAgICAgICBoZWxwVmlldy5zdHlsZS5sZWZ0ID0gKHNvdXJjZUJveC5sZWZ0ICsgc291cmNlQm94LndpZHRoLzIgLSAxNykgKyAncHgnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbCA9ICdyaWdodCc7XG4gICAgICAgICAgICAgICAgICAgIGhlbHBWaWV3LnN0eWxlLmxlZnQgPSAoc291cmNlQm94LnJpZ2h0IC0gdmlld0JveC53aWR0aCAtIHNvdXJjZUJveC53aWR0aC8yICsgMTcpICsgJ3B4JztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc291cmNlQm94LnRvcCArIHZpZXdCb3guaGVpZ2h0IDwgd2luZG93LmlubmVySGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsID0gJ3RvcCc7XG4gICAgICAgICAgICAgICAgICAgIGhlbHBWaWV3LnN0eWxlLnRvcCA9IChzb3VyY2VCb3gudG9wICsgc291cmNlQm94LmhlaWdodCArIDE4KSArICdweCc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbCA9ICdib3R0b20nO1xuICAgICAgICAgICAgICAgICAgICBoZWxwVmlldy5zdHlsZS50b3AgPSAoc291cmNlQm94LmJvdHRvbSAtIHNvdXJjZUJveC5oZWlnaHQgLSB2aWV3Qm94LmhlaWdodCAtIDE4KSArICdweCc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaGVscFZpZXcuY2xhc3NOYW1lID0gYGhlbHAtdmlldyAke3ZlcnRpY2FsfS0ke2hvcml6b250YWx9YDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBIaWRlIHRoZSB2aWV3IGFmdGVyIDUwMG1zLCB0byBhbGxvdyB0aGUgdXNlciB0byBob3ZlciBvdmVyIHRoZSB2aWV3XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdmlld1Nob3VsZFN0YXlWaXNpYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgaGVscFZpZXcuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICB9LCAxMDApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGhlbHBWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB2aWV3U2hvdWxkU3RheVZpc2libGUgPSB0cnVlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGhlbHBWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBoZWxwVmlldy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIHZpZXdTaG91bGRTdGF5VmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xufSIsImltcG9ydCB7IEFwcGxpY2F0aW9uIH0gZnJvbSAnLi9hcHBsaWNhdGlvbic7XG5pbXBvcnQgeyBIZWxwVmlldyB9IGZyb20gJy4vdXRpbC9oZWxwLXZpZXcnO1xuXG5sZXQgYXBwID0gbmV3IEFwcGxpY2F0aW9uKCk7XG5cbi8vIEFwcGx5IHRoZSBIZWxwVmlldyB0byBlYWNoIGVsZW1lbnRcbmZvciAobGV0IGVsZW1lbnQgb2YgQXJyYXkuZnJvbShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1oZWxwLXZpZXddJykpKSB7XG4gICAgSGVscFZpZXcoPEhUTUxFbGVtZW50PmVsZW1lbnQpO1xufSJdLCJuYW1lcyI6WyJkM1NlbGVjdGlvbi5zZWxlY3Rpb24iLCJzZWxlY3Rpb24iLCJkaXNwYXRjaC5EaXNwYXRjaEV2ZW50IiwiZGlzcGF0Y2guRGlzcGF0Y2giLCJkMy5tZWFuIiwiZDMubWVkaWFuIiwiZDMuZXh0ZW50IiwiZDMuZm9ybWF0IiwiZDMuc2VsZWN0IiwiZDMuZ2VvTWVyY2F0b3IiLCJkMy5nZW9QYXRoIiwiZDMuZXZlbnQiLCJkMy5zY2FsZUxpbmVhciIsImQzLmhzbCIsImQzLm1heCIsImQzLlBhZGRpbmciLCJkMy5kcmFnIiwiem9vbSIsImQzLnpvb20iLCJkMy5heGlzTGVmdCIsImQzLmF4aXNCb3R0b20iLCJkMy56b29tSWRlbnRpdHkiLCJ0cmFuc2l0aW9uIiwiZDMudHJhbnNpdGlvbiIsImQzLnNjYWxlUG9pbnQiLCJkMy56b29tVHJhbnNmb3JtIiwiZDMuZGlzcGF0Y2giLCJjb21wb25lbnRzLk5laWdoYm9yaG9vZE1hcENvbXBvbmVudCIsImNvbXBvbmVudHMuTGlzdGluZ0Jsb2Nrc0NvbXBvbmVudCIsImNvbXBvbmVudHMuU2NhdHRlclBsb3RDb21wb25lbnQiLCJjb21wb25lbnRzLkRldGFpbENvbXBvbmVudCIsImNvbXBvbmVudHMuU2VsZWN0aW9uQ29tcG9uZW50IiwiY29tcG9uZW50cy5GaWx0ZXJzQ29tcG9uZW50IiwiZDMuanNvbiIsImQzLmNzdiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBMkJBOzs7QUFHQUEscUJBQXFCLENBQUMsU0FBUyxDQUFDLFdBQVcsR0FBRztJQUN4QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDZixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNuQyxDQUFDLENBQUM7Q0FDSixDQUFDO0FBRU5BLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUc7SUFDekMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ2IsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUM7UUFDNUMsSUFBSSxVQUFVLEVBQUU7WUFDWixJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDbEQ7S0FDSixDQUFDLENB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
