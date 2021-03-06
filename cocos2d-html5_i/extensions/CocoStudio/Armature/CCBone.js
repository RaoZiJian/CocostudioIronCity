/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

/**
 * Base class for cc.Bone objects.
 * @class
 * @extends cc.NodeRGBA
 */
cc.Bone = cc.NodeRGBA.extend({
    _boneData:null,
    _armature:null,
    _childArmature:null,
    _displayManager:null,
    _ignoreMovementBoneData:false,
    _tween:null,
    _tweenData:null,
    _name:"",
    _childrenBone:null,
    _parentBone:null,
    _boneTransformDirty:false,
    _worldTransform:null,
    _blendType:0,
    ctor:function () {
        cc.NodeRGBA.prototype.ctor.call(this);
        this._boneData = null;
        this._armature = null;
        this._childArmature = null;
        this._displayManager = null;
        this._ignoreMovementBoneData = false;
        this._tween = null;
        this._tweenData = null;
        this._name = "";
        this._childrenBone = [];
        this._parentBone = null;
        this._boneTransformDirty = true;
        this._worldTransform = cc.AffineTransformMake(1, 0, 0, 1, 0, 0);
        this._blendType=cc.BlendType.NORMAL;
    },

    /**
     * release objects
     */
    release:function () {
        CC_SAFE_RELEASE(this._tweenData);
        for (var i = 0; i < this._childrenBone.length; i++) {
            CC_SAFE_RELEASE(this._childrenBone[i]);
        }
        this._childrenBone = [];
        CC_SAFE_RELEASE(this._tween);
        CC_SAFE_RELEASE(this._displayManager);
        CC_SAFE_RELEASE(this._boneData);
        CC_SAFE_RELEASE(this._childArmature);
    },

    /**
     * Initializes a CCBone with the specified name
     * @param {String} name
     * @return {Boolean}
     */
    init:function (name) {
        cc.NodeRGBA.prototype.init.call(this);
        if (name) {
            this._name = name;
        }
        this._tweenData = new cc.FrameData();
        this._tween = new cc.Tween();
        this._tween.init(this);
        this._displayManager = new cc.DisplayManager();
        this._displayManager.init(this);
        return true;
    },

    /**
     * set the boneData
     * @param {cc.BoneData} boneData
     */
    setBoneData:function (boneData) {
        if (!boneData) {
            cc.log("boneData must not be null");
            return;
        }
        this._boneData = boneData;
        this._name = this._boneData.name;
        this._zOrder = this._boneData.zOrder;
        this._displayManager.initDisplayList(boneData);
    },

    /**
     * boneData getter
     * @return {cc.BoneData}
     */
    getBoneData:function () {
        return this._boneData;
    },

    /**
     * set the armature
     * @param {cc.Armature} armature
     */
    setArmature:function (armature) {
        this._armature = armature;
        if(armature){
            this._tween.setAnimation(this._armature.getAnimation());
        }
    },

    /**
     * armature getter
     * @return {cc.Armature}
     */
    getArmature:function () {
        return this._armature;
    },

    /**
     * update worldTransform
     * @param dt
     */
    update:function (dt) {
        var locParentBone = this._parentBone;
        var locArmature = this._armature;
        var locTweenData = this._tweenData;
        var locWorldTransform = this._worldTransform;

        if (locParentBone) {
            this._boneTransformDirty = this._boneTransformDirty || locParentBone.isTransformDirty();
        }
        if (this._boneTransformDirty) {
            if (locArmature.getArmatureData().dataVersion >= cc.CONST_VERSION_COMBINED) {
                var locBoneData = this._boneData;
                locTweenData.x += locBoneData.x;
                locTweenData.y += locBoneData.y;
                locTweenData.skewX += locBoneData.skewX;
                locTweenData.skewY += locBoneData.skewY;
                locTweenData.scaleX += locBoneData.scaleX;
                locTweenData.scaleY += locBoneData.scaleY;
                
                locTweenData.scaleX -= 1;
                locTweenData.scaleY -= 1;
            }

            locWorldTransform.a = locTweenData.scaleX * Math.cos(locTweenData.skewY);
            locWorldTransform.b = locTweenData.scaleX * Math.sin(locTweenData.skewY);
            locWorldTransform.c = locTweenData.scaleY * Math.sin(locTweenData.skewX);
            locWorldTransform.d = locTweenData.scaleY * Math.cos(locTweenData.skewY);
            locWorldTransform.tx = locTweenData.x;
            locWorldTransform.ty = locTweenData.y;


            this._worldTransform = cc.AffineTransformConcat(this.nodeToParentTransform(), locWorldTransform);

            if (locParentBone) {
                this._worldTransform = cc.AffineTransformConcat(this._worldTransform, locParentBone._worldTransform);
            }
        }
        cc.DisplayFactory.updateDisplay(this, this._displayManager.getCurrentDecorativeDisplay(), dt, this._boneTransformDirty || locArmature.getArmatureTransformDirty());

        var locChildrenBone = this._childrenBone;
        for (var i = 0; i < locChildrenBone.length; i++) {
            locChildrenBone[i].update(dt);
        }
        this._boneTransformDirty = false;
    },

    /**
     * Rewrite visit ,when node draw, g_NumberOfDraws is changeless
     */
    visit:function (ctx) {
        var node = this.getDisplayManager().getDisplayRenderNode();
        if (node) {
            node.visit(ctx);
        }
    },

    /**
     * update display color
     * @param {cc.c3b} color
     */
    updateDisplayedColor:function (color) {
        this._realColor = cc.c3b(255,255,255);
        cc.NodeRGBA.prototype.updateDisplayedColor.call(this, color);
        this.updateColor();
    },

    /**
     * update display opacity
     * @param {Number} opacity
     */
    updateDisplayedOpacity:function (opacity) {
        this._realOpacity = 255;
        cc.NodeRGBA.prototype.updateDisplayedOpacity.call(this, opacity);
        this.updateColor();
    },

    /**
     * update display color
     */
    updateColor:function () {
        var display = this._displayManager.getDisplayRenderNode();
        if (display && display.RGBAProtocol) {
            var locDisplayedColor = this._displayedColor;
            var locTweenData = this._tweenData;
            var locOpacity = this._displayedOpacity * locTweenData.a / 255;
            var locColor = cc.c3b(locDisplayedColor.r * locTweenData.r / 255, locDisplayedColor.g * locTweenData.g / 255, locDisplayedColor.b * locTweenData.b / 255);
            if (cc.Browser.supportWebGL) {
                display.setOpacity(locOpacity);
                display.setColor(locColor);
            } else {
                cc.NodeRGBA.prototype.setOpacity.call(display, this._displayedOpacity * locTweenData.a / 255);
                cc.NodeRGBA.prototype.setColor.call(display, locColor);
            }
        }
    },

    /**
     * update display zOrder
     */
    updateZOrder: function () {
        if (this._armature.getArmatureData().dataVersion >= cc.CONST_VERSION_COMBINED) {
            var zorder = this._tweenData.zOrder + this._boneData.zOrder;
            this.setZOrder(zorder);
        }
        else {
            this.setZOrder(this._tweenData.zOrder);
        }
    },

    /**
     * Add a child to this bone, and it will let this child call setParent(cc.Bone) function to set self to it's parent
     * @param {cc.Bone} child
     */
    addChildBone:function (child) {
        if (!child) {
            cc.log("Argument must be non-nil");
            return;
        }
        if (child._parentBone) {
            cc.log("child already added. It can't be added again");
            return;
        }
        if (cc.ArrayGetIndexOfObject(this._childrenBone, child) < 0) {
            this._childrenBone.push(child);
            child.setParentBone(this);
        }
    },

    /**
     * Removes a child bone
     * @param {cc.Bone} bone
     * @param {Boolean} recursion
     */
    removeChildBone:function (bone, recursion) {
        for (var i = 0; i < this._childrenBone.length; i++) {
            if (this._childrenBone[i] == bone) {
                if (recursion) {
                    var ccbones = bone._childrenBone;
                    for (var j = 0; j < ccbones.length; j++) {
                        bone.removeChildBone(ccbones[j], recursion);
                    }
                }
                bone.setParentBone(null);
                bone.getDisplayManager().setCurrentDecorativeDisplay(null);
                cc.ArrayRemoveObject(this._childrenBone, bone);
            }
        }
    },

    /**
     * Remove itself from its parent CCBone.
     * @param {Boolean} recursion
     */
    removeFromParent:function (recursion) {
        if (this._parentBone) {
            this._parentBone.removeChildBone(this, recursion);
        }
    },

    /**
     * Set parent bone.
     * If _parent is NUll, then also remove this bone from armature.
     * It will not set the CCArmature, if you want to add the bone to a CCArmature, you should use cc.Armature.addBone(bone, parentName).
     * @param {cc.Bone}  parent  the parent bone.
     */
    setParentBone:function (parent) {
        this._parentBone = parent;
    },

    /**
     * parent bone getter
     * @return {cc.Bone}
     */
    getParentBone:function () {
        return this._parentBone;
    },

    /**
     * child armature setter
     * @param {cc.Armature} armature
     */
    setChildArmature:function (armature) {
        if (this._childArmature != armature) {
            this._childArmature = armature;
        }
    },

    /**
     * child armature getter
     * @return {cc.Armature}
     */
    getChildArmature:function () {
        return this._childArmature;
    },

    /**
     * child bone getter
     * @return {Array}
     */
    getChildrenBone:function () {
        return this._childrenBone;
    },

    /**
     * tween getter
     * @return {cc.Tween}
     */
    getTween:function () {
        return this._tween;
    },

    /**
     * zOrder setter
     * @param {Number}
        */
    setZOrder:function (zOrder) {
        if (this._zOrder != zOrder)
            cc.Node.prototype.setZOrder.call(this, zOrder);
    },

    /**
     * transform dirty setter
     * @param {Boolean}
        */
    setTransformDirty:function (dirty) {
        this._boneTransformDirty = dirty;
    },

    /**
     * transform dirty getter
     * @return {Boolean}
     */
    isTransformDirty:function () {
        return this._boneTransformDirty;
    },

    /**
     * return world transform
     * @return {{a:0.b:0,c:0,d:0,tx:0,ty:0}}
     */
    nodeToArmatureTransform:function () {
        return this._worldTransform;
    },

    /**
     * Returns the world affine transform matrix. The matrix is in Pixels.
     * @returns {cc.AffineTransform}
     */
    nodeToWorldTransform: function () {
        return cc.AffineTransformConcat(this._worldTransform, this._armature.nodeToWorldTransform());
    },

    /**
     * get render node
     * @returns {cc.Node}
     */
    getDisplayRenderNode: function () {
        return this._displayManager.getDisplayRenderNode();
    },

    /**
     * Add display and use  _displayData init the display.
     * If index already have a display, then replace it.
     * If index is current display index, then also change display to _index
     * @param {cc.Display} displayData it include the display information, like DisplayType.
     *          If you want to create a sprite display, then create a CCSpriteDisplayData param
     *@param {Number}    index the index of the display you want to replace or add to
     *          -1 : append display from back
     */
    addDisplay:function (displayData, index) {
        index = index || 0;
        return this._displayManager.addDisplay(displayData, index);
    },

    addSkin:function (skin, index) {
        index = index||0;
        return this._displayManager.addSkin(skin, index);
    },

    /**
     * change display by index
     * @param {Number} index
     * @param {Boolean} force
     */
    changeDisplayByIndex:function (index, force) {
        this._displayManager.changeDisplayByIndex(index, force);
    },

    /**
     * displayManager setter
     * @param {cc.DisplayManager}
        */
    setDisplayManager:function (displayManager) {
        this._displayManager = displayManager;
    },

    /**
     * displayManager dirty getter
     * @return {cc.DisplayManager}
     */
    getDisplayManager:function () {
        return this._displayManager;
    },

    /**
     *    When CCArmature play a animation, if there is not a CCMovementBoneData of this bone in this CCMovementData, this bone will hide.
     *    Set IgnoreMovementBoneData to true, then this bone will also show.
     * @param {Boolean} bool
     */
    setIgnoreMovementBoneData:function (bool) {
        this._ignoreMovementBoneData = bool;
    },

    /**
     * ignoreMovementBoneData  getter
     * @return {Boolean}
     */
    getIgnoreMovementBoneData:function () {
        return this._ignoreMovementBoneData;
    },

    /**
     * tweenData  getter
     * @return {cc.FrameData}
     */
    getTweenData:function () {
        return this._tweenData;
    },

    /**
     * name  setter
     * @param {String} name
     */
    setName:function (name) {
        this._name = name;
    },

    /**
     * name  getter
     * @return {String}
     */
    getName:function () {
        return this._name;
    },

    /**
     * blendType  setter
     * @param {cc.BlendType} blendType
     */
    setBlendType:function (blendType) {
        this._blendType = blendType;
    },

    /**
     * blendType  getter
     * @return {cc.BlendType}
     */
    getBlendType:function () {
        return this._blendType;
    }
});

/**
 * allocates and initializes a bone.
 * @constructs
 * @return {cc.Bone}
 * @example
 * // example
 * var bone = cc.Bone.create();
 */
cc.Bone.create = function (name) {
    var bone = new cc.Bone();
    if (bone && bone.init(name)) {
        return bone;
    }
    return null;
};