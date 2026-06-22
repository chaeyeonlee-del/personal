export const HOO_DESIGN_WIDTH = 390;
export const HOO_DESIGN_HEIGHT = 844;

export type HooResponsiveLayout = {
  width: number;
  height: number;
  isFramed: boolean;
  screenWidth: number;
  screenHeight: number;
  shortScreenRatio: number;
};

export type HooSessionElementLayout = {
  copyLift: number;
  guideCompactness: number;
  wandBottom: number;
  wandScale: number;
};

export type HooCompletionCharacterLayout = {
  bubbleLeft: number;
  bubbleTop: number;
  characterLeft: number;
  characterTop: number;
};

export type HooCompletionButtonLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function scaleX(value: number, width: number) {
  return (value / HOO_DESIGN_WIDTH) * width;
}

export function scaleY(value: number, height: number) {
  return (value / HOO_DESIGN_HEIGHT) * height;
}

export function scaleSize(value: number, width: number) {
  return scaleX(value, width);
}

export function getHooResponsiveLayout({
  screenWidth,
  screenHeight,
}: {
  screenWidth: number;
  screenHeight: number;
}): HooResponsiveLayout {
  const isFramed = screenWidth >= 768;
  const width = isFramed ? HOO_DESIGN_WIDTH : screenWidth;
  const height = (width / HOO_DESIGN_WIDTH) * HOO_DESIGN_HEIGHT;
  const visibleHeightRatio = screenHeight / height;
  const shortScreenRatio = clamp((1 - visibleHeightRatio) / 0.22, 0, 1);

  return {
    width,
    height,
    isFramed,
    screenWidth,
    screenHeight,
    shortScreenRatio,
  };
}

export function getHooSessionElementLayout(layout: HooResponsiveLayout): HooSessionElementLayout {
  const { width, height, shortScreenRatio } = layout;

  return {
    copyLift: scaleY(48, height) * shortScreenRatio,
    guideCompactness: shortScreenRatio,
    wandBottom: 0,
    wandScale: 1 - shortScreenRatio * 0.22,
  };
}

export function getHooCompletionCharacterLayout({
  layout,
  bubbleSize,
  characterSize,
}: {
  layout: HooResponsiveLayout;
  bubbleSize: number;
  characterSize: number;
}): HooCompletionCharacterLayout {
  const elements = getHooSessionElementLayout(layout);
  const titleBottom = scaleY(227, layout.height) - elements.copyLift + scaleSize(36, layout.width);
  const bottomInset = Math.max(30, scaleSize(38, layout.width));
  const footerTop = layout.screenHeight - bottomInset - scaleY(56, layout.height);
  const idealBubbleTop = (titleBottom + footerTop) / 2 - bubbleSize / 2;
  const bubbleTop = clamp(
    idealBubbleTop,
    titleBottom + scaleY(28, layout.height),
    footerTop - bubbleSize - scaleY(18, layout.height),
  );

  return {
    bubbleLeft: (layout.width - bubbleSize) / 2,
    bubbleTop,
    characterLeft: (layout.width - characterSize) / 2,
    characterTop: bubbleTop + (bubbleSize - characterSize) / 2,
  };
}

export function getHooCompletionButtonLayout({
  layout,
  bubbleSize,
  characterSize,
  buttonWidth,
  buttonHeight,
}: {
  layout: HooResponsiveLayout;
  bubbleSize: number;
  characterSize: number;
  buttonWidth: number;
  buttonHeight: number;
}): HooCompletionButtonLayout {
  const bottomInset = Math.max(30, scaleSize(38, layout.width));
  const top = layout.screenHeight - bottomInset - buttonHeight;

  return {
    left: (layout.width - buttonWidth) / 2,
    top,
    width: buttonWidth,
    height: buttonHeight,
  };
}
