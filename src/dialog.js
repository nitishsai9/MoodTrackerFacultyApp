;(function(root, factory ) {
	if( typeof define === 'function' && define.amd ) {
		define( function() {
			root.dialog = factory();
			return root.dialog;
		} );
	} else if( typeof exports === 'object' ) {
		module.exports = factory();
	} else {
		root.dialog = factory();
	}
}(this,function () {
  var styles = document.createElement('style')
  styles.innerHTML='.x-dialog{opacity:0;transition:all ease 0.3s;margin:10px}\n'+
  '.x-dialog-wrap{align-items:center;}'+
  '.x-dialog-wrap.top{justify-content:flex-start;}\n .x-dialog-wrap.top .x-dialog{transform:translateY(-100%);}\n'+
  '.x-dialog-wrap.center{justify-content:center;}\n .x-dialog-wrap.center .x-dialog{transform:scale(0.1,0.1);}\n'+
  '.x-dialog-wrap.bottom{justify-content:flex-end}\n .x-dialog-wrap.bottom .x-dialog{transform:translateY(100%);}\n'+
  '.x-dialog-wrap.right{align-items:flex-end}\n .x-dialog-wrap.right .x-dialog{transform:translateX(100%);}\n'+
  '.x-dialog.show{visibility:visible;opacity:1;transform:translate(0,0) scale(1,1) !important;}\n'+
  '.x-dialog-mask{transition:all ease 0.3s;opacity:0}\n .x-dialog-mask.show{opacity:0.35}'
  document.head.appendChild(styles)
  var dialogs = {}
  var showingDialogs=[]
  var START_INDEX = 100
  var MAX_INDEX = 1<<30//toast

  function getDialogMask(){
    var maskId = 'x_dialog_mask'
    var mask = document.getElementById(maskId)
    if(!mask){
      mask = document.createElement('div')
      mask.id = maskId
      mask.style = 'left:0;right:0;top:0;bottom:0;'
      mask.style.position = 'fixed'
      mask.style.background =  '#000'
      mask.className='x-dialog-mask'

    }
    return mask
  }
  /**
   * 
   * @param {Object} options 
   * - title
   * - content
   * - message
   * - buttons
   */
  function Dialog(options) {
    options = options || {}
    this.options = options

    var dialogWrap = this.dialogLayer = document.createElement('div')
    var dialogDiv = this.dialogDiv = document.createElement('div')
    var dialogId = 'x_dialog_' + (options.id || Date.now())

    dialogWrap.id = dialogId
    dialogWrap.className='x-dialog-wrap'
    dialogWrap.style="left:0;right:0;top:0;bottom:0;"
    dialogWrap.style.position = 'fixed'
    dialogWrap.style.display='flex'
    dialogWrap.style.flexDirection='column'

    dialogDiv.className='x-dialog'
    dialogDiv.style.borderRadius = '8px'
    dialogDiv.style.overflow='hidden'
    dialogDiv.style.boxShadow = '0px 10px 10px 0px rgba(0,0,0,0.5)'
    dialogDiv.style.border='#ddd 1px solid'
    dialogWrap.appendChild(dialogDiv)
    options.onCreate&&options.onCreate.call(this, options)

    this._config(options)
  }
  Dialog.prototype.reconfig = function(options){
    this._config(options)
  }
  Dialog.prototype._config=function(options){
    options = options || {}
    if(options!==this.options){
      options = this.options = Object.assign(this.options, options)
    }
    var self = this
    options.dismissOnClickOutside=options.dismissOnClickOutside===undefined?true:options.dismissOnClickOutside
    
    var dialogWrap = this.dialogLayer
    dialogWrap.className='x-dialog-wrap '+(options.position||'center top')

    var dialogDiv = this.dialogDiv
    dialogDiv.style.width = options.width||'280px'
    dialogDiv.style.maxWidth = options.maxWidth||'480px'
    dialogDiv.style.height = options.height||'auto'
    dialogDiv.style.maxHeight = options.maxHeight||'auto'
    dialogDiv.style.backgroundColor = options.bgColor || 'white'
    if(!options.noMask){

      dialogDiv.onclick=function(event){
        event=event||window.event
        event.stopPropagation()
        return true;
      }

      dialogWrap.onclick=function(){
        let handled = options.onOutsideClick&&options.onOutsideClick.call(self);
        if(!handled && options.dismissOnClickOutside){
          self.dismiss()
        }
      }

    }else{
      dialogWrap.style.pointerEvents='none'
      dialogDiv.style.pointerEvents='none'
    }
    if (options.title!==undefined) {
      var titleDiv = this._getChild('x-dialog-title')
      titleDiv.style.textAlign='center'
      titleDiv.style.display='flex'
      titleDiv.style.justifyContent='center'
      titleDiv.style.alignItems='center'
      // titleDiv.style.borderBottom='solid 1px #ddd'
      titleDiv.style.margin='20px'
      titleDiv.style.fontWeight='bold'
      titleDiv.style.fontSize='14px'
      titleDiv.innerHTML = options.title
      options.titleStyler&&options.titleStyler.call(self, titleDiv.style)
    }else{
      this._removeChild('x-dialog-title')
    }
    if (options.message!==undefined) {
      var d = this._getChild('x-dialog-message', true)
      d.style='margin:20px 20px 25px 20px;text-align:center;font-size:14px'
      d.innerHTML = options.message
      options.messageStyler&&options.messageStyler.call(self, d.style)

    }else{
      this._removeChild('x-dialog-message')
    }
    if (options.content) {
      var d = this._getChild('x-dialog-content', true)
      d.innerHTML = ''
      d.appendChild(options.content)
    }else{
      this._removeChild('x-dialog-content')
    }
    if (options.buttons && options.buttons.length) {
      var d = this._getChild('x-dialog-buttons', true)
      d.style="display:flex;"
      d.innerHTML = ''
      var horizontalButtonCount = options.horizontalButtonCount||2
      if (options.buttons.length > horizontalButtonCount) {
        d.style.flexDirection='column'
      }
      d.style.borderCollapse='collapse'

      options.buttons.forEach(btn => {
        var btnDiv = document.createElement('div')
        btnDiv.className = 'x-dialog-btn'
        
        btnDiv.style.cursor='pointer'
        btnDiv.style.display='flex'
        btnDiv.style.justifyContent='center'
        btnDiv.style.alignItems='center'

        btnDiv.style.color = btn.textColor||'#333'
        btnDiv.style.fontSize = '14px'

        btnDiv.style.backgroundColor = btn.bgColor||'transparent'
        btnDiv.style.flexGrow='1'
        btnDiv.style.width='0'
        btnDiv.style.height='32px'
        btnDiv.style.borderTop='solid 1px #efefef'
        btnDiv.style.borderRight='solid 1px #efefef'
        btn.styler&&btn.styler.call(self, btnDiv.style)

        btnDiv.innerHTML = btn.text
        btnDiv.addEventListener('click', function () {
          btn.handler.call(self, btn)
        })
        d.appendChild(btnDiv)
      });
    }else{
      this._removeChild('x-dialog-buttons')
    }

    options.onConfig&&options.onConfig.call(this, options)
    return this
  }

  Dialog.prototype._getChild = function (cls, readd) {
    var dialogDiv = this.dialogDiv
    var child = dialogDiv.querySelector('.'+cls) 
    if(!child){
      child = document.createElement('div')
      child.className=cls
      dialogDiv.appendChild(child)
    }else if(readd){
      dialogDiv.removeChild(child)
      dialogDiv.appendChild(child)
    }
    return child
  }

  Dialog.prototype._removeChild=function(cls){
    var dialogDiv = this.dialogDiv
    var child = dialogDiv.querySelector('.'+cls)
    if(child && child.parentNode){
      child.parentNode.removeChild(child)
    }
  }

  Dialog.prototype.show = function () {
    if(this.isShowing)return
    this.isShowing=true
    this._dismissTimer && clearTimeout(this._dismissTimer)
    var noMask = this.options.noMask
    // var maskIndex = INDEX++
    var layerIndex;
    if(!noMask){
      layerIndex = handleShow(this)
      var mask = getDialogMask() 
      if (!mask.parentNode) {
        document.body.appendChild(mask)
      }
      mask.style.zIndex = layerIndex
      this.mask = mask
    } else {
      layerIndex = this.options.index
    }
    if (!this.dialogLayer.parentNode) {
      document.body.appendChild(this.dialogLayer)
    }
    this.dialogLayer.style.zIndex = layerIndex
    this.onShow && this.onShow()
    var dialogDiv = this.dialogDiv
    var mask = this.mask
    this._showTimer = setTimeout(function(){
      mask&&mask.classList.add('show')
      dialogDiv.classList.add('show')
    },10)
  }

  Dialog.prototype.dismiss = function () {
    if(!this.isShowing)return
    this.isShowing=false
    this._showTimer && clearTimeout(this._showTimer)
    var self = this
    self.dialogDiv.classList.remove('show')
    var mask = this.mask
    if(mask){
      var index = handleDismiss(this)
      
      if(index <= 0){
        mask.classList.remove('show')
      }else {
        mask.style.zIndex=index
      }
    }

    this._dismissTimer=setTimeout(function(){
      if (self.dialogLayer.parentNode) {
        self.dialogLayer.parentNode.removeChild(self.dialogLayer)
      }
      if (mask && showingDialogs.length===0 && mask.parentNode) {
        mask.parentNode.removeChild(mask)
      }
    },300)
    this.onDismiss && this.onDismiss()
  }

  function handleShow(dialog){
    var last = showingDialogs[showingDialogs.length-1]
    showingDialogs.push(dialog)
    return last? (~~last.dialogLayer.style.zIndex +1) : START_INDEX
  }

  function handleDismiss(dialog){
    var index = -1
    for (var i = showingDialogs.length-1; i >=0; i--) {
      var d = showingDialogs[i];
      if(d===dialog){
        index=i
        break;
      }
    }
    if(index>=0) showingDialogs.splice(index,1)
    if(!!showingDialogs.length){
      var last = showingDialogs[showingDialogs.length-1]
      return ~~last.dialogLayer.style.zIndex
    }else{
      return -1
    }
  }

  function dialog(options) {
    var id = options.id
    if (id && dialogs[id]) {
      return dialogs[id]._config(options)
    }
    var d = new Dialog(options)
    if (id) {
      dialogs[id] = d
    }
    return d
  }
  dialog.alert = function (title, message) {
    if(message===undefined){
      message = title
      title = undefined
    }
    dialog({
      id:'alert',
      title: title,
      message: message,
      buttons: [
        {
          text: dialog.lang.Ok||'Ok', handler: function () {
            this.dismiss()
          }
        }
      ]
    }).show()
  }
  dialog.confirm = function (title, message) {
    if(message===undefined){
      message = title
      title = undefined
    }
    return new Promise(function (resolve, reject) {
      dialog({
        id:'confirm',
        title: title,
        message: message,
        buttons: [
          {
            text: dialog.lang.Cancel||'Cancel',
            handler: function () {
              this.dismiss()
              reject(this)
            }
          },
          {
            text: dialog.lang.Ok||'Ok',
            handler: function () {
              this.dismiss()
              resolve(this)
            }
          },
        ]
      }).show()
    })
  }

  dialog.prompt = function (title, labelText, defValue) {
    
    return new Promise(function (resolve, reject) {
      dialog({
        id:'prompt',
        title: title,
        onCreate:function(options){
          var input = document.createElement('input')
          input.value = defValue||''
          input.style.width = '100%'
          input.style.padding = '8px 4px'
          input.style.display = 'block'
          input.style.marginTop = '12px'
          input.style.border = 'solid 1px #ddd'
          input.style.borderRadius = '8px'
          input.style.fontSize='14px'
          var label = document.createElement('label')
          label.style.display='block'
          label.style.color='#999'
          label.style.fontSize='12px'
          label.innerHTML = labelText
          var content = document.createElement('div')
          content.style.margin='0px 20px 15px 20px'
          content.appendChild(label)
          content.appendChild(input)
          options.content = content
          this.input = input
          this.label = label
        },
        onConfig:function(options){
          this.input.value = defValue||''
          this.label.innerHTML = labelText
          console.log('onConfig')
        },
        buttons: [
          {
            text: dialog.lang.Cancel||'Cancel',
            handler: function () {
              this.dismiss()
              reject(this)
            }
          },
          {
            text: dialog.lang.Ok||'Ok',
            handler: function () {
              this.dismiss()
              resolve(this.input.value)
            }
          },
        ]
      }).show()
    })
  }
  var toastDismissTimer = 0
  var toastDialog ;
  dialog.toast=function(message, durationSec){
    toastDismissTimer && clearTimeout(toastDismissTimer)
    
    if(toastDialog){
      toastDialog.dismiss()
    }
    
    var d = dialog({
      position:dialog.toast.position||'top',
      // id:'toast',
      index: MAX_INDEX,
      noMask:true,
      bgColor:'rgba(250,250,250,0.9)',
      message:message,
      onDismiss:function(){
        toastDialog = null
      }
    })
    
    d.show()
    toastDialog = d
    toastDismissTimer = setTimeout(function(){
      d.dismiss()
    }, (durationSec||3)*1000)
  }
  dialog.toast.position = 'top'
  var language = navigator.language||navigator.browserLanguage
  if(/^zh\b/.test(language)){
    dialog.lang={
      'Ok':'确定',
      'Cancel':'取消'
    }
  }else{
    dialog.lang={}
  }
    
  return dialog
}));