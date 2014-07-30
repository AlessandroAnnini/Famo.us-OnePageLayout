define(function(require, exports, module) {
    var View = require('famous/core/View');
    var Engine = require('famous/core/Engine');
    var Modifier = require('famous/core/Modifier');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Surface = require('famous/core/Surface');
    var GridLayout = require("famous/views/GridLayout");
    var Easing = require('famous/transitions/Easing');
    var Transitionable = require('famous/transitions/Transitionable');
    var GenericSync = require('famous/inputs/GenericSync');
    var TapEvents = require('components/TapEvents');

    var menuHeight;
    var totalHeight = 0;
    var surfBase;
    var surfaceList;
    var sync;
    var currentPage = 0;
    var touchedPage;
    var contentPos = new Transitionable(0);

    OnePageLayout.prototype = Object.create(View.prototype);
    OnePageLayout.prototype.constructor = OnePageLayout;

    OnePageLayout.DEFAULT_OPTIONS = {
        transition: {
            // -- hand swipe
            duration: 300,
            curve: Easing.outExpo
        },
        posThreshold: 80,
        velThreshold: 0.75
    };

    function OnePageLayout(options) {
        View.apply(this, arguments);
        Engine.emit('created', this);

        sync = new GenericSync(
            ['mouse', 'touch'], {
                direction: GenericSync.DIRECTION_Y
            });

        surfaceList = options.surfaceList;

        menuHeight = options.menuHeight;

        // --- BASE NODE
        var rootModifier = new StateModifier({
            size: [undefined, totalHeight],
            origin: [0, 0]
        });
        this.nodeRoot = this.add(rootModifier);

        // --- BACKGROUND
        surfBase = new Surface({
            size: [window.innerWidth, window.innerHeight],
            content: "background",
            properties: {
                textAlign: 'center',
                background: '#333333',
                color: "#BFBFBF"
                //boxShadow: '0 3px 2px 0px black'
            }
        });
        var baseMod = new Modifier({
            transform: Transform.translate(0, 0, 0)
        });
        this.nodeRoot.add(baseMod).add(surfBase);

        // --- MENU
        var grid = _createMenu();

        this.menuMod = new Modifier({
            transform: Transform.translate(0, 0, 2)
        });

        this.nodeRoot.add(this.menuMod).add(grid);

        // --- PAGES
        this.pagesModifier = new StateModifier({
            origin: [0, 0],
            size: [undefined, totalHeight]
        });
        this.nodePages = this.add(this.pagesModifier);

        this.nodePagesMod = new Modifier({
            //transform: Transform.translate(0, menuHeight + this.contentPos.get(), 0)
            transform: function() {
                return Transform.translate(0, menuHeight + contentPos.get(), 0);
            }.bind(this)
        });

        _createPages(this.nodePages);

        // -- ADD TO RENDER TREE
        this._add(this.nodePagesMod).add(this.nodePages);
        this._add(this.nodeRoot);

        // handle Swipe
        _handleSwipe.call(this);
    }

    function _goto(page) {
        if (page >= 0 && page < surfaceList.length) {
            var slideVal = surfaceList[page].heightLevel;
            contentPos.set(-slideVal, {
                // -- menu change page
                duration: 500,
                curve: Easing.outBounce
            }, function() {
                currentPage = page;
            }.bind(this));
        }
    }

    function _slideDown() {
        console.log('down');
        if (currentPage === 0) {
            _stay.call(this);
            return;
        }
        var slideVal = surfaceList[currentPage - 1].heightLevel;
        contentPos.set(-slideVal, this.options.transition, function() {
            currentPage -= 1;
        }.bind(this));
    }

    function _slideUp() {
        console.log('up');
        if (currentPage === surfaceList.length - 1) {
            _stay.call(this);
            return;
        }
        var slideVal = surfaceList[currentPage + 1].heightLevel;
        contentPos.set(-slideVal, this.options.transition, function() {
            currentPage += 1;
        }.bind(this));
    }

    function _stay() {
        console.log('stay');
        var SlideVal = surfaceList[currentPage].heightLevel;
        contentPos.set(-SlideVal, this.options.transition, function() {

        }.bind(this));
    }

    function _handleSwipe() {
        sync.on('update', function(data) {
            console.log('update');
            var currentPosition = contentPos.get();
            contentPos.set(currentPosition + data.delta);
        }.bind(this));

        sync.on('end', (function(data) {
            console.log('end');
            var velocity = data.velocity;
            var position = contentPos.get();

            if (contentPos.get() > this.options.posThreshold) {
                if (velocity < -this.options.velThreshold) {
                    _slideUp.call(this);
                } else {
                    _slideDown.call(this);
                }
            } else {
                if (velocity > this.options.velThreshold) {
                    _slideDown.call(this);
                } else if (velocity < -this.options.velThreshold) {
                    _slideUp.call(this);
                } else {
                    _stay.call(this);
                }
            }
            console.log('c. page: ' + currentPage);
        }).bind(this));
    }

    function _createPages(nodePages) {
        for (var i = 0; i < surfaceList.length; i++) {
            surfaceList[i].n = i;
            surfaceList[i].heightLevel = totalHeight;
            surfaceList[i].mod = new Modifier({
                transform: Transform.translate(0, totalHeight, 1)
            });

            surfaceList[i].currentPos = new Transitionable(0);
            surfaceList[i].pipe(sync);

            surfaceList[i].on('tap', function(e) {
                touchedPage = e.surface.n;
            });

            totalHeight += surfaceList[i].getSize()[1];

            nodePages.add(surfaceList[i].mod).add(surfaceList[i]);
        }
    }

    function _createMenu() {
        var grid = new GridLayout({
            dimensions: [surfaceList.length, 1]
        });

        var surfaces = [];
        grid.sequenceFrom(surfaces);

        for (var i = 0; i < surfaceList.length; i++) {
            var surfGrid = new Surface({
                content: surfaceList[i].title,
                classes: ['unselectable'],
                size: [undefined, menuHeight],
                properties: {
                    backgroundColor: "hsl(" + (i * 360 / 15) + ", 100%, 50%)",
                    color: "#404040",
                    textAlign: 'center',
                    lineHeight: menuHeight + "px"
                }
            });

            surfGrid.n = i;

            surfGrid.on('click', function() {
                _goto(this.n);
            });

            surfaces.push(surfGrid);
        }
        return grid;
    }

    module.exports = OnePageLayout;

});