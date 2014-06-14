var messages = require('../messages')
var keyList = require('./keylist')
var JSONfn = require('../jsonfn');
var cm = exports

var editing = false;

var $veryLarge = $('#veryLarge')

cm.editing = function() {
  return editing
}

cm.update = function(value) {
  console.log(value.value);
  if (JSONfn.parseSafe(value.value).length < 1e4) {

    $veryLarge.hide()
    var tmp = JSONfn.parseSafe(value.value).split('');
    editor.doc.setValue("module.exports = " + tmp.slice(1, tmp.length-1).join(''));
    CodeMirror.commands["selectAll"](editor);
      format();
  } else {
    var tmp = JSONfn.parseSafe(value.value).split('');
    $veryLarge.show()
    $veryLarge.unbind('click')
    $veryLarge.on('click', function() {
    editor.doc.setValue("module.exports = " + tmp.slice(1, tmp.length-1).join(''));
    CodeMirror.commands["selectAll"](editor);
      format();
      $veryLarge.hide()
    })
  }
}

//
// build the code mirror editor
//

var editor = CodeMirror.fromTextArea(document.getElementById("code-json"), {
  lineNumbers: true,
  styleActiveLine: true,
  matchBrackets: true,
  mode: "text/javascript",
  viewportMargin: Infinity
})

function getSelectedRange() {
  return {
    from: editor.getCursor(true),
    to: editor.getCursor(false)
  };
}

function format() {
  var range = getSelectedRange();
  editor.autoFormatRange(range.from, range.to);
  if (window.getSelection) {
  if (window.getSelection().empty) {  // Chrome
    window.getSelection().empty();
  } else if (window.getSelection().removeAllRanges) {  // Firefox
    window.getSelection().removeAllRanges();
  }
} else if (document.selection) {  // IE?
  document.selection.empty();
}
}

function commentSelection(isComment) {
  var range = getSelectedRange();
  editor.commentRange(isComment, range.from, range.to);
}

//
// if the data in the editor changes and it's valid, save it
//

editor.on('blur', function() {
  editing = false
})

editor.on('focus', function() {
  editing = true
})

var saveBounce
editor.on('change', function(cm, change) {

  console.log(JSONfn.stringify(eval('(' + editor.doc.getValue().split("module.exports = ")[1] + ')')))
  var value = {
    key: keyList.val(),
    value: JSONfn.stringify(eval('(' + editor.doc.getValue().split("module.exports = ")[1] + ')'))
  }

  clearTimeout(saveBounce)
  saveBounce = setTimeout(function() {

    if (cm.doc.isClean() === false) {

      messages.emit('data', {
        request: 'manage/updateValue',
        value: value
      })
    }

  }, 16)
  window.editor = editor;
})