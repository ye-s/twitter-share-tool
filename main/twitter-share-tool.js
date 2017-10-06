'use strict';
var showSharingTool = false;
var txtSelection = {};
var arrowKeys = [37, 38, 39, 40];

function getSelectionText() {
    var shareButtonContainer, 
        selectedTextArea = document.activeElement;

    txtSelection = window.getSelection();
    if (!isSelectionValid(txtSelection)) {
      showSharingTool = false;
      return;
    }

    shareButtonContainer = document.querySelector('.tst-tooltip-container');
    showTooltip(txtSelection, shareButtonContainer);
    closeSharingTool(shareButtonContainer);
}

// returns selected html elements
function getSelectedHTML(sel) {
  var i, range, 
    resultHTML = '',
    len = sel.rangeCount, 
    container = document.createElement("div");

  for (i = 0, len; i < len; ++i) {
    container.appendChild(sel.getRangeAt(i).cloneContents());
  }
  resultHTML = container.innerHTML;

  return resultHTML;
}

// checks selected text for empty tags and block elements
function isSelectionValid(selection) {
  var divTag = '<div>',   
    isValid = false,
    emptyElementsRegex = /<[^\/>][^>]*><\/[^>]+>/g,
    contentElementsRegex = /<(div|p|h1|h2|h3|h4|h5|h6|ul|li|ol)[^>]*>/g;

  if (!selection || selection.isCollapsed || !selection.rangeCount) {
      return isValid;
  }
  if (selection.toString().trim() !== '') {
    var selectedHTML = getSelectedHTML(selection);
    var parentNode = getParentNode(selection);
    if(getParentNode(selection) === '') {
      return isValid;
    }
    var cleanedSelectedHTML = selectedHTML.toString().replace(emptyElementsRegex, '');
    isValid = !cleanedSelectedHTML.match(divTag) && cleanedSelectedHTML.match(contentElementsRegex) < 2;

    return isValid;
  }
}

// get common Parent node for all selected text
function getParentNode(selection) {
  var range, 
    parentNodes = '';

  if (selection.getRangeAt(0)) {
    range = selection.getRangeAt(0);
    parentNodes = range.commonAncestorContainer;
    
    if (parentNodes.nodeName !== 'DIV') {
      return parentNodes;
    }
  }
  return  parentNodes;
}

function showTooltip(selection, shareButtonContainer) {
  var firstLine, secondLine,
      xPosition, yPosition,
      calculatedPosition = {},
      range = selection.getRangeAt(0),
      clientRects = range.getClientRects();

  // first line (rectangle) with text
  firstLine = clientRects[0];

  yPosition = Math.round(firstLine.top);

  // calculate x position for different row quantity 
  // to be always in middle of selected text
  if (clientRects.length < 2) {
    xPosition = Math.round(firstLine.left + (firstLine.width / 2));
  } else {
    secondLine = clientRects[1];
    var maxLeftPos = Math.round(secondLine.left);
    var maxRightPos = Math.round(firstLine.right)
    xPosition = maxLeftPos + ((maxRightPos - maxLeftPos) / 2);
  }

  calculatedPosition = applyAbsolutePositionFix(xPosition, yPosition);

  // calculate for text selected near header
  if (calculatedPosition.y < 60) {
    shareButtonContainer.style.top = calculatedPosition.y + 'px';
  } else {
    shareButtonContainer.style.top = calculatedPosition.y - 50 + 'px';
  }
  shareButtonContainer.style.left = calculatedPosition.x - 30 + 'px';

  if (!(shareButtonContainer.className).match('tst-visible')) {
    shareButtonContainer.className += ' tst-visible';
  }
  addTwitterButton(shareButtonContainer, selection);
  showSharingTool = true;

}

// margin size and topScrolled are used with absolute tooltip position,
function applyAbsolutePositionFix(xPos, yPos) {
  var topScrolled = 0,
      containerLeftMargin = 0,
      position = {},
      contentContainer = document.querySelector('.tst-content-container');

  containerLeftMargin = Math.round(parseFloat(window
                    .getComputedStyle(contentContainer, null)
                    .getPropertyValue('margin-left')));

  topScrolled = (window.pageYOffset !== undefined) ? window.pageYOffset 
              : (document.documentElement || document.body.parentNode || document.body).scrollTop;
  position.x =  xPos - containerLeftMargin;
  position.y =  yPos + topScrolled;

  return position;
  }

function addTwitterButton(shareButtonContainer, selection) {
  var shareButton = document.getElementById('twitter-share-button');
  shareButton.href = 'https://twitter.com/intent/tweet?text=' + prepareText(selection);
}

// formating text and encoding to url ready view
function prepareText (selection) {
  var message = selection.toString();

  if (message.length > 107) {
    message = message.substring(0, 105) + '...';
  }
  return encodeURIComponent(message);
}

function closeSharingTool(tooltipDiv) {
  var closeSharingToolHandler = function (e) {
    if (!tooltipDiv.contains(e.target) && !showSharingTool) {
      tooltipDiv.classList.remove('tst-visible');
      txtSelection = txtSelection.removeAllRanges();
    }
    document.removeEventListener('mouseup', closeSharingToolHandler);
  };
  document.addEventListener('mouseup', closeSharingToolHandler);
}

// common method to calculate pop-up window position in center of screen
function showCenteredPopUp(url) {
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (600 / 2)) + dualScreenLeft;
    var top = ((height / 2) - (300 / 2)) + dualScreenTop;

    var newWindow = window.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600, top=' + top + ', left=' + left);

    if (window.focus) {
        newWindow.focus();
    }
}

document.onmouseup = getSelectionText;

// adds arrow keys selection
document.onkeyup = function(e) {
    if ((arrowKeys.indexOf(e.keyCode) !== -1) && e.shiftKey) getSelectionText();
}