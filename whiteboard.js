'use strict';

let VISIBLE_CLASS = 'is--visible',
HIDDEN_CLASS = 'is--hidden',
SELECTED_CLASS = 'is--selected',
LOADING_CLASS = 'is--loading',
EDITING_CLASS = 'is--editing',
DISABLED_CLASS = 'is--disabled',
OPEN_CLASS = 'is--open',
AWW_COLOR = '#3DC476',
CANVAS_STARTING_ZOOM_LEVEL = 100,
ASSETS_PATH = '/static/site/app-assets', // TODO set your path to assets
MAX_CUSTOM_COLORS = 7,
DEFAULT_TOOLBAR = {
  select: {
    tools: ['select'],
    currentTool: 'select'
  },
  undo: {
    tools: ['undo'],
    currentTool: 'undo'
  },
  colors: {
    tools: ['color']
  },
  draw: {
    tools: ['pencil', 'marker', 'lineStraight'],
    currentTool: 'pencil',
    selected: true,
    size: 2
  },
  erase: {
    tools: ['eraser', 'eraserArea', 'trash'],
    currentTool: 'eraser',
    size: 10
  },
  shape: {
    tools: ['rectangle', 'rectangleFilled', 'ellipse', 'ellipseFilled'],
    currentTool: 'rectangle',
    size: 2
  },
  text: {
    tools: ['text'],
    currentTool: 'text'
  },
  postit: {
    tools: ['postit'],
    currentTool: 'postit'
  },
  upload: {
    tools: ['image', 'presentation', 'presentation', 'gdrive-upload']
  }
};
let COLORS = [
  '#000000',
  '#f7412d',
  '#47b04b',
  '#1194f6',
  '#ffc200',
  '#9d1bb2',
  '#ec1561',
  '#7a5547'
];
let SIZES = [2, 4, 6, 9, 15, 25, 40];
let TOOLS = ['pencil', 'eraser', 'eraserArea', 'text', 'image', 'undo', 'trash', 'pan', 'lineStraight', 'rectangle', 'rectangleFilled', 'ellipse', 'ellipseFilled', 'marker', 'select', 'postit', 'presentation'];
let toolbarPrefix = 'aww-toolbar-';
// let aww = <BOARD_OBJECT>; // TODO set AwwBoard element variable here to equal aww if it's named differently

let boardMenus,
  toolbar,
  colorWheelCanvas,
  colorWheelPicker,
  customColorsRow,
  addColorPlusEl,
  boardNameField,
  loader,
  accountButton,
  loginRegisterButton,
  mobileLoginRegisterButton,
  chatNameInput,
  changeNameDoneButton,
  changeNameButton,
  chatbox,
  chatMessages,
  chatContent,
  chatHeaderNormal,
  chatInput,
  nextPageButton,
  prevPageButton,
  newPageButton,
  gotoPageButton,
  zoomLevelText,
  panButton,
  fullscreen,
  fullscreenIcon;

let pdfExportInProgress = false,
  isInFullscreen = false,
  openedMenu,
  loadingCount = 0;

let isChatVisible = false,
  chatWasClosed = false,
  isInIframe = false,
  lastTimestampTime,
  defaultAvatarPath = ASSETS_PATH + '/ic-avatar.svg';

let openedToolboxParentId,
  toolsInToolbar = DEFAULT_TOOLBAR,
  defaultColors = COLORS,
  monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

let sliderPercTick = 90 / (SIZES.length - 1); // 15
let movingSlider,
  sliderWidth,
  sliderStartingPoint,
  sliderParentId,
  sliderIndex,
  sliderText,
  newSliderSize;

let dotHalfSize = 9,
  colorWheelSize,
  colorWheelCanvasCtx,
  relativeStartingPoint,
  newColorEl,
  newColor,
  customColors = [];

function initToolbar() {

    boardMenus = $('#board-menus');
    toolbar = boardMenus.find('#main-toolbar');
    colorWheelCanvas = toolbar.find('.tools__colorwheel--canvas');
    colorWheelPicker = toolbar.find('.tools__colorwheel--picker');
    customColorsRow = toolbar.find('#custom-colors-row');
    addColorPlusEl = toolbar.find('#aww-toolbar-add-color');
    boardNameField = boardMenus.find('.toolbar__board--name');
    loader = boardMenus.find('.logo__box');
    accountButton = boardMenus.find('#account-button');
    loginRegisterButton = boardMenus.find('#login-register-button');
    mobileLoginRegisterButton = boardMenus.find('#mobile-login-register-button');
    chatNameInput = boardMenus.find('.chat__username');
    changeNameDoneButton = boardMenus.find('#change-name-done-button');
    changeNameButton = boardMenus.find('#change-name-button');
    //chatbox = boardMenus.find('.chat__box');
    chatMessages = boardMenus.find('.chat__messages');
    chatContent = boardMenus.find('.chat__content');
    chatHeaderNormal = chatbox.find('.chat__header--normal-state');
    chatInput = boardMenus.find('.chat__input');
    nextPageButton = boardMenus.find('#next-page');
    prevPageButton = boardMenus.find('#prev-page');
    newPageButton = boardMenus.find('#new-page');
    gotoPageButton = boardMenus.find('.pagination--boards');
    zoomLevelText = boardMenus.find('#zoom-level-text');
    panButton = boardMenus.find('#pan');
    fullscreen = boardMenus.find('#fullscreen');
    fullscreenIcon = fullscreen.find('img');
    colorWheelSize = colorWheelCanvas.width();
    //isChatVisible = chatbox.hasClass(VISIBLE_CLASS);

    toolbar.on('mousedown', penDownHandler);
    toolbar.on('touchstart', penDownHandler);
    toolbar.on('mouseup', penUpHandler);
    toolbar.on('mouseleave', penUpHandler);
    toolbar.on('touchend', penUpHandler);
    colorWheelCanvas.on('touchmove', penDownHandler);

    toolbar.on('click', function (e) {

        let clickedElement = $(e.target);

        if (clickedElement.parent().hasClass('tools__item--button')) {
            e.stopPropagation();
            aww.getCurrentUser((user) => {
                if (user.status === 'RO') return;

                let parentElement = clickedElement.parent().parent();
                let toolId = (parentElement.attr('id') || '').substring(toolbarPrefix.length);
                let toolbox = parentElement.find('.toolbox');

                if (toolbox[0] && openedToolboxParentId !== toolbox.parent().attr('id')) {
                    // open toolbox
                    closeMenus();
                    openedToolboxParentId = toolbox.parent().attr('id');
                    show(toolbox);
                    if (toolId === 'colors') initCustomColors();
                    else setupSlider(toolbox);
                    mainToolbarButtonClicked(toolsInToolbar[toolId].currentTool, parentElement);

                } else {
                    // support closing the toolbox if user clicks on toolbar button again
                    mainToolbarButtonClicked(toolId, parentElement);
                    if (toolId !== 'add-color') closeMenus();
                }
            });


        } else if ((clickedElement.attr('id') || '').includes('upload-via-url')) {

            let urlField = clickedElement.parent().parent().find('#aww-toolbar-url-for-upload');
            let originalSrc = urlField.val();
            let fileUrl = 'https://converter.awwapp.com/api/v2/get_picture/?url=' + encodeURIComponent(originalSrc);

            if (fileUrl.match(/\.(gif|jpe?g|png)$/ig)) {
                aww.uploadImageFromUrl(fileUrl, function(){});
            } else if (fileUrl.match(/\.(ppt|pdf)$/ig)) {
                aww.uploadPresentationFromUrl(fileUrl, function(){});
            } else {
                // TODO Show message that file is not valid
            }

            urlField.val('');

        }

    });

    // chat
    let chatButton = boardMenus.find('#chat-button');

    chatButton.on('click', function (e) {
        closeMenus();
        if (isChatVisible) {
          unshow(chatbox);
        } else {
          show(chatbox);
          chatInput.focus();
        }
        isChatVisible = !isChatVisible;
    });

    chatContent.on('click', (e) => closeMenus());

    changeNameButton.on('click', (e) => { e.preventDefault(); changeChatName(); });

    changeNameDoneButton.on('click', (e) => userNameChanged());

    chatNameInput.on('keyup', (e) => {
        if ((e.keyCode == '13') || (e.key && e.key.toLowerCase() == 'enter')) {
        e.preventDefault();
        e.stopPropagation();
        userNameChanged();
    }
    });

    chatInput.on('keyup', (e) => sendChat(handleMessages, e));


    // pagination
    prevPageButton.on('click', function() {
        prevPage();
    });

    nextPageButton.on('click', function() {
        nextPage();
    });

    newPageButton.on('click', function() {
        nextPage();
    });

    gotoPageButton.on('change', function() {
        let nextPage = gotoPageButton.val() - 1;
        if (isNaN(nextPage)) return;

        aww.getLastPage(page => {
          if (nextPage >= 0 && nextPage <= page) {
            aww.setPage(nextPage);
            recomputePagination();
          }
        });
    });

    panButton.on('click', function (e) {
        if (panButton.hasClass(SELECTED_CLASS)) {
            panButton.addClass(SELECTED_CLASS);
        }
        aww.setTool('pan');
    });

    // color wheel setup
    colorWheelCanvasCtx = colorWheelCanvas[0].getContext('2d');
    let image = new Image();
    image.onload = function() {
        colorWheelCanvasCtx.drawImage(image, 0, 0, image.width, image.height); // draw the image on the canvas
    };
    image.src = ASSETS_PATH + '/color-wheel.png';


    // MOBILE

    // toolbar on mobile
    let mobileToolbarButtons = boardMenus.find('.js-mobile-tools');
    mobileToolbarButtons.on('click', (e) => {
        let showBtn = mobileToolbarButtons.find('.js-open-tools'),
        hideBtn = mobileToolbarButtons.find('.js-close-tools'),
        shouldOpen = !showBtn.hasClass('is--hidden');

    closeMenus();

    if (shouldOpen) {
        toolbar.removeClass('mobile--hidden');
        showBtn.addClass('is--hidden');
        hideBtn.removeClass('is--hidden');
    }
});

}

function initCustomColors() {
    let customColorChildren = customColorsRow.find('.tools__item');
    for (let i = customColorChildren.length - 2; i >= 0; i--) {
        customColorChildren[i].remove();
    }
    customColors.forEach(function (color, i) {
        addColorEl(color, defaultColors.length + i);
    });
}

function prevPage() {
    aww.getCurrentPage((page) => {
      aww.setPage(page - 1);
      recomputePagination();
    });
}

function nextPage() {
    aww.getCurrentPage((page) => {
      aww.setPage(page + 1);
      recomputePagination();
    });
}

function addDropdownClickEvent(menuButton, dropdownMenu, readOnlyAvailable) {

    menuButton.on('click', function (e) {
        aww.getCurrentUser((user) => {
          if (user.status === 'RO' && !readOnlyAvailable) return;

          if (dropdownMenu.hasClass(VISIBLE_CLASS)) {
            dropdownMenu.removeClass(VISIBLE_CLASS);
          } else {
            closeMenus();
            openedMenu = dropdownMenu;
            dropdownMenu.addClass(VISIBLE_CLASS);
          }
        });
    });
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }

    fullscreenIcon.src = ASSETS_PATH + '/ic-fullscreen.svg';
    isInFullscreen = false;
}

function updateZoomLevel(zoomLevel) {
    let zoomPercentage = zoomLevel / CANVAS_STARTING_ZOOM_LEVEL * 100;
    // 0.1 is the lowest point to show zoom level
    zoomLevelText.text((zoomPercentage > 1 ?
            Math.round(zoomPercentage) :
            Math.max(Math.round(zoomPercentage * 10) / 10, 0.1)
    ) + '%');
}

function getExportPdfMessage(isAdmin) {
    return 'Please, don\'t close your browser until we export your PDF. ' +
        (isAdmin ? ' If it takes too long we\'ll send it to you via email.' : '');
}

function disable(element) {
    if (!element.hasClass(DISABLED_CLASS)) {
        element.addClass(DISABLED_CLASS);
    }
}

function enable(element) {
    if (element.hasClass(DISABLED_CLASS)) {
        element.removeClass(DISABLED_CLASS);
    }
}

function hide(element) {
    if (!element.hasClass(HIDDEN_CLASS)) {
        element.addClass(HIDDEN_CLASS);
    }
}

function unhide(element) {
    if (element.hasClass(HIDDEN_CLASS)) {
        element.removeClass(HIDDEN_CLASS);
    }
}

function show(element) {
    if (!element.hasClass(VISIBLE_CLASS)) {
        element.addClass(VISIBLE_CLASS);
    }
}

// :D
function unshow(element) {
    if (element.hasClass(VISIBLE_CLASS)) {
        element.removeClass(VISIBLE_CLASS);
    }
}

function resetChat() {
    chatMessages.html('');
}

function calculateChatTextareaHeight() {
    chatInput.parent().css('height', Math.max(48, Math.min(100, chatInput.scrollHeight)) + 'px');
}

function sendChat(appendLog, e) {
    calculateChatTextareaHeight();
    if (typeof e.which !== 'undefined' && e.which !== 13) return;

    aww.getCurrentUser((user) => {
        aww.sendChatMessage($(e.target).val(), user.uid, true);
        appendLog($(e.target).val(), user.uid);
        $(e.target).val('');
        chatInput.parent().css('height', '48px');;
    });

}

function handleMessages(message, uid, time) {
    aww.getCurrentUser((me) => {
        show(chatbox);

        time = time ? new Date(time) : new Date();
        let line;
        // if more than 2 minutes passed
        if (!lastTimestampTime || (lastTimestampTime - time)/1000 > 2) {
          let formattedTime = formatTime(time);
          let timestamp = $('<time class="message__timestamp">' + formattedTime + '</time>');
          chatMessages.append(timestamp);
          lastTimestampTime = time;
        }

        let isMe = me.uid === uid;
        aww.getBoardUsers((users) => {
            let user = isMe ? me : users[uid];
            let meClass = isMe ? ' self' : '';

            line = $('<div class="message">' +
              (meClass ? '' : '<div class="message__avatar">' +
                '<img src="' + (user && user.avatarThumbUrl ? user.avatarThumbUrl : defaultAvatarPath) + '" width="20" height ="20">' +
                '</div>') +
              '<div class="message__box' + meClass + '">' +
              '<div class="message__content">' +
              '<p class="paragraph">' + message + '</p>' +
              '</div>' +
              '</div>' +
              '</div>');

            chatMessages.append(line);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

}

function formatTime(time) {
    return monthShortNames[time.getMonth()] + ' ' +
        time.getDate() + '   ' +
        time.toLocaleString('en-US', { hour: 'numeric',minute:'numeric', hour12: true });
}

function changeTool(data) {
    let toolId = data.tool;
    if (data.stateless || toolId === 'undo') return;

    if (panButton.hasClass(SELECTED_CLASS) && toolId !== 'pan') {
        panButton.removeClass(SELECTED_CLASS);
    }

    let parentId;
    let currentlySelectedTool;
    for (let key in toolsInToolbar) {
        if (toolsInToolbar.hasOwnProperty(key)) {
            let value  = toolsInToolbar[key];
            if (value.tools.includes(toolId)) parentId = key;

            if (value.selected) {
                currentlySelectedTool = {key, value};
            }
        }
    }

    if (parentId && !parentId.includes('upload')) {

        if (currentlySelectedTool) {
            delete currentlySelectedTool.value.selected;
            let prevSelectedToolParent = toolbar.find('#' + toolbarPrefix + currentlySelectedTool.key).children().first();
            let prevSelectedTool = toolbar.find('#' + toolbarPrefix + currentlySelectedTool.value.currentTool).children().first();
            if (prevSelectedTool) prevSelectedTool.removeClass(SELECTED_CLASS);
            if (prevSelectedToolParent) prevSelectedToolParent.removeClass(SELECTED_CLASS);
        }

        toolsInToolbar[parentId].currentTool = toolId;
        toolsInToolbar[parentId].selected = true;
        let toolParent = toolbar.find('#' + toolbarPrefix + parentId).children().first();
        let thumb = toolParent ? toolParent.find('img').first() : null;
        let selectedTool = boardMenus.find('#' + toolbarPrefix + toolId).children().first();
        if (toolParent) toolParent.addClass(SELECTED_CLASS);
        if (selectedTool) selectedTool.addClass(SELECTED_CLASS);
        if (thumb) thumb.attr('src', ASSETS_PATH + '/ict-' + toolId + '.svg');
    }
}

function changeColor(color) {
    let parent = boardMenus.find('#' + toolbarPrefix + 'colors');
    let colorIndicator = parent.find('.picked__color');
    colorIndicator.css('background', color);

    aww.setStrokeColor(color);
}

function recomputePagination() {
    aww.getCurrentPage((currentPage) => {
        aww.getLastPage((lastPage) => {

            let onFirstPage = (currentPage === 0),
            onLastPage = (currentPage >= lastPage);

            if (onFirstPage) {
                disable(prevPageButton);
            } else {
                enable(prevPageButton);
            }
            if (onLastPage) {
                hide(nextPageButton);
                unhide(newPageButton);
            } else {
                unhide(nextPageButton);
                hide(newPageButton);
            }

            gotoPageButton.val('');
            if(currentPage>lastPage){lastPage = lastPage + 1;}
            gotoPageButton.text((1 + currentPage) + '/' + (1 + lastPage));
        });
    });
}

function mainToolbarButtonClicked(toolId) {
    if (!toolId) return;

    if (toolId.includes('undo')) {

        aww.doUndo();

    } else if (toolId.includes('trash')) {

        aww.getCurrentPage(page => aww.clearPage(page));

    } else if (toolId.includes('color-')) {

        let colorIndex = parseInt(toolId.substring('color-'.length));
        changeColor(defaultColors.concat(customColors)[colorIndex]);

    } else if (toolId.includes('add-color')) {

        let colorWheel = toolbar.find('.tools__colorwheel');
        show(colorWheel);
        hide(addColorPlusEl);
        addColor(AWW_COLOR, true);

    }  else if (toolId === 'image') {

      aww.uploadImageFromComputer(
        image => console.log('Image is fetched from computer...'),
        opData => console.log('Image is converted to operation...', opData)
      );

    } else if (toolId === 'presentation') {

      aww.uploadPresentationFromComputer(
        presentationUrl => console.log('Presentation is uploaded to server...', presentationUrl),
        opData => console.log('Presentation is converted to operation...', opData)
      );

    } else if (TOOLS.includes(toolId)) {

        aww.setTool(toolId);
        changeTool({tool: toolId});

    }
}

function closeMobileToolbar() {
    let mobileToolbarButtons = boardMenus.find('.js-mobile-tools'),
        showBtn = mobileToolbarButtons.find('.js-open-tools'),
        hideBtn = mobileToolbarButtons.find('.js-close-tools');

    toolbar.addClass('mobile--hidden');
    showBtn.removeClass('is--hidden');
    hideBtn.addClass('is--hidden');
}

function closeMenus() {
    closeToolbox();
    closeMobileToolbar();

    if (openedMenu) unshow(openedMenu);
    openedMenu = undefined;
}

function closeToolbox() {
    if (openedToolboxParentId) {
        let toolboxParent = boardMenus.find('#' + openedToolboxParentId);
        let toolbox = toolboxParent.find('.toolbox');
        unshow(toolbox);

        let colorWheel = toolbar.find('.tools__colorwheel');
        if (colorWheel && colorWheel.hasClass(VISIBLE_CLASS)) {
            colorWheel.removeClass(VISIBLE_CLASS);
            unhide(addColorPlusEl);
            if (newColorEl) newColorEl.parent().removeClass(SELECTED_CLASS);
            resetSlider();
        }

        openedToolboxParentId = undefined;
    }
}

function penDownHandler(e) {
    if ($(e.target).hasClass('slide--dot')) {

        colorWheelSize = colorWheelCanvas.width();
        movingSlider = $(e.target);
        let sliderParent = $(e.target).closest('.tools__item');
        sliderParentId = (sliderParent.attr('id') || '').substring(toolbarPrefix.length);
        sliderWidth = movingSlider.parent().width();
        sliderStartingPoint = [e.touches ? e.touches[0].clientX : e.clientX,
            e.touches ? e.touches[0].clientY : e.clientY];
        relativeStartingPoint = [movingSlider.offset().left - colorWheelCanvas.offset().left, movingSlider.offset().top - colorWheelCanvas.offset().top];

        if (sliderParentId !== 'colors') {
            sliderText = sliderParent.find('.tools__bigtool--value');
            sliderIndex = Math.max(0, SIZES.indexOf(toolsInToolbar[sliderParentId].size));
        }
        toolbar.on('mousemove', penMoveHandler);
        toolbar.on('touchmove', penMoveHandler);
    } else if ($(e.target) === colorWheelCanvas){
        let canvasPos = getAbsPosition(colorWheelCanvas);
        let currentXPos = ((e.touches ? e.touches[0].clientX : e.clientX) - canvasPos.left + dotHalfSize);
        let currentYPos = ((e.touches ? e.touches[0].clientY : e.clientY) - canvasPos.top + dotHalfSize);
        let canvasScale = colorWheelCanvas[0].getBoundingClientRect().width / colorWheelCanvas.width();

        let margin = limitInsideCircle(currentXPos - 2 * dotHalfSize, currentYPos - 2 * dotHalfSize,
            colorWheelSize / 2 * canvasScale, colorWheelSize / 2 * canvasScale, colorWheelSize / 2 * canvasScale);
        colorWheelPicker.css('margin-left', margin.x + 'px');
        colorWheelPicker.css('margin-top', margin.y + 'px');
        let imageData = colorWheelCanvasCtx.getImageData(currentXPos / canvasScale - 2 * dotHalfSize,
            currentYPos / canvasScale - 2 * dotHalfSize, 1, 1);
        let pixel = imageData.data;
        newColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
        newColorEl.css('background-color', newColor);
        changeColor(newColor);
        customColors[customColors.length - 1] = newColor;
    }
}

function penMoveHandler(e) {

    if (movingSlider) {
        let currentXPos = e.touches ? e.touches[0].clientX : e.clientX;
        let dx = currentXPos - sliderStartingPoint[0];
        let currentYPos = e.touches ? e.touches[0].clientY : e.clientY;
        let dy = currentYPos - sliderStartingPoint[1];

        if (sliderParentId === 'colors') {
            let margin = limitInsideCircle(relativeStartingPoint[0] + dx, relativeStartingPoint[1] + dy,
                colorWheelSize / 2, colorWheelSize / 2, colorWheelSize / 2);
            movingSlider.css('margin-left', margin.x + 'px');
            movingSlider.css('margin-top', margin.y + 'px');

            let x = movingSlider.offset().left - colorWheelCanvas.offset().left;
            let y = movingSlider.offset().top - colorWheelCanvas.offset().top;
            let imageData = colorWheelCanvasCtx.getImageData(x + dotHalfSize, y + dotHalfSize, 1, 1);
            let pixel = imageData.data;
            newColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
            newColorEl.css('background-color', newColor);

        } else {
            let sliderTick = Math.floor(dx / (sliderWidth * sliderPercTick / 100));
            if (SIZES[sliderTick + sliderIndex]) {
                newSliderSize = SIZES[sliderTick + sliderIndex];
                movingSlider.css('margin-left', (sliderTick + sliderIndex) * sliderPercTick + '%');
                sliderText.text(sliderTick + sliderIndex + 1);
            }
        }
    }
}

function penUpHandler(e) {

    if (sliderParentId === 'colors' && newColor) {

        changeColor(newColor);
        customColors[customColors.length - 1] = newColor;

    } else if (movingSlider && newSliderSize) {
        toolsInToolbar[sliderParentId].size = newSliderSize;
        aww.setSize(newSliderSize, sliderParentId);
        resetSlider();
    }

    toolbar.off('mousemove', penMoveHandler);
    toolbar.off('touchmove', penMoveHandler);
}

function getAbsPosition(element) {
    let rec = element[0].getBoundingClientRect();
    return {top: rec.top + window.scrollY, left: rec.left + window.scrollX};
}

function limitInsideCircle(x, y, r, cx, cy) {
    let dist = distance(x, y, cx, cy);
    if (dist <= r) {
        return {x: x, y: y};
    }
    else {
        x = x - cx;
        y = y - cy;
        let radians = Math.atan2(y, x);
        return {
            x: Math.cos(radians) * r + cx - dotHalfSize,
            y: Math.sin(radians) * r + cy - dotHalfSize
        }
    }
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function resetSlider() {
    movingSlider = undefined;
    sliderWidth = undefined;
    sliderStartingPoint = undefined;
    sliderParentId = undefined;
    sliderIndex = undefined;
    sliderText = undefined;
    newSliderSize = undefined;

    relativeStartingPoint = undefined;
    newColorEl = undefined;
    newColor = undefined;
}

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function addColor(color, isSelected) {
    customColors.push(color);
    let lastColorPosition = defaultColors.length + customColors.length;
    addColorEl(color, lastColorPosition, isSelected);
}

function addColorEl(color, colorIndex, isSelected) {
    // assuming that we will always have number of colors in row as there are default colors
    if (customColors.length > MAX_CUSTOM_COLORS) {
        reorderCustomColors();
        // get last color index after customColors has been reordered
        colorIndex = defaultColors.length + MAX_CUSTOM_COLORS - 1;
    }
    newColorEl = $('<div class="predefined__color" style="background-color: ' + color + '">');
    let newEl = $('<li class="tools__item" id="aww-toolbar-color-' + colorIndex + '"></li>').append(
        $('<div class="tools__item--button' + (isSelected ? ' ' + SELECTED_CLASS : '') + '"></div>').append(
          newColorEl
        )
    );
  newEl.insertBefore(customColorsRow.children()[customColorsRow.children().length - 1]);
}

function changeChatName() {
  if (!chatHeaderNormal.hasClass(EDITING_CLASS)) {
    chatHeaderNormal.addClass(EDITING_CLASS);
    chatNameInput.removeAttr('readonly');
    chatNameInput.focus();
    chatNameInput.select();
  }
}

function userNameChanged() {
  let name = chatNameInput.val();

  if(name) aww.setUserName(name);

  chatHeaderNormal.removeClass(EDITING_CLASS);
  chatNameInput.attr('readonly', '');
}

function reorderCustomColors() {
    customColors = customColors.slice(Math.max(0, customColors.length - MAX_CUSTOM_COLORS));
    customColorsRow.remove(customColorsRow.children()[0]);

    // change color index of all custom color elements
    customColorsRow.children().forEach(function (child, i) {
        if ((child.attr('id') || '').includes('aww-toolbar-color-')) {
            child.attr('id', 'aww-toolbar-color-' + (defaultColors.length + i));
        }
    });

}

function setupSlider(toolbox) {
    let slider = toolbox.find('.slide--dot');
    if (slider) {
        let sliderText = toolbox.find('.tools__bigtool--value');
        let sliderIndex = Math.max(0, SIZES.indexOf(toolsInToolbar[openedToolboxParentId.substring(toolbarPrefix.length)].size));
        slider.css('margin-left', sliderIndex * sliderPercTick + '%');
        if(sliderText) sliderText.text(sliderIndex + 1);
    }
}

function showLoader(loading) {
  if (!loading) return;

  loadingCount += loading;
  if (loadingCount > 0) {
    loader.addClass(LOADING_CLASS);
  } else {
    loadingCount = 0; // ensure it's never negative
    loader.removeClass(LOADING_CLASS);
  }
}

aww.onReceiveOps((ops) => {
  recomputePagination();
  ops.forEach((op) => { if (op.op === 'chat') { handleMessages(op.text, op.uid, op.time); }});
});
aww.onLoading(loading => showLoader(loading));
aww.onJoinBoard(user => {
  setTimeout(() => {
    aww.getCurrentUser(me => {
      if (me.uid === user.uid) chatNameInput.val(user.nick);
    });
  }, 500);
});
// TODO compare uid from current user to the uid stored in your database and set it with
// aww.setUserUid(uidFromYourDatabase)