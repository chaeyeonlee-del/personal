import { equal, ok } from 'node:assert/strict';
import { test } from 'node:test';

import {
  getHooCompletionButtonLayout,
  getHooCompletionCharacterLayout,
  getHooResponsiveLayout,
  getHooSessionElementLayout,
  scaleSize,
  scaleY,
} from './hooResponsiveLayout.ts';

test('hoo responsive layout keeps the stage full width on short Safari viewports', () => {
  const layout = getHooResponsiveLayout({ screenWidth: 430, screenHeight: 740 });

  equal(layout.width, 430);
  ok(layout.height > 900);
  ok(layout.shortScreenRatio > 0);
});

test('hoo responsive layout preserves the original 390x844 stage on matching devices', () => {
  const layout = getHooResponsiveLayout({ screenWidth: 390, screenHeight: 844 });

  equal(layout.width, 390);
  equal(layout.height, 844);
  equal(layout.shortScreenRatio, 0);
});

test('hoo responsive layout keeps a phone aspect ratio on wide desktop web viewports', () => {
  const layout = getHooResponsiveLayout({ screenWidth: 2560, screenHeight: 1440 });

  equal(layout.isFramed, true);
  equal(layout.width, 390);
  equal(layout.height, 844);
  equal(layout.shortScreenRatio, 0);
});

test('hoo session layout scales the wand only on short screens', () => {
  const regularLayout = getHooResponsiveLayout({ screenWidth: 390, screenHeight: 844 });
  const shortLayout = getHooResponsiveLayout({ screenWidth: 430, screenHeight: 740 });

  const regularElements = getHooSessionElementLayout(regularLayout);
  const shortElements = getHooSessionElementLayout(shortLayout);

  ok(shortElements.wandScale < regularElements.wandScale);
  ok(shortElements.copyLift > regularElements.copyLift);
});

test('hoo session layout anchors the wand to the visible viewport bottom', () => {
  const layout = getHooResponsiveLayout({ screenWidth: 430, screenHeight: 740 });
  const elements = getHooSessionElementLayout(layout);

  ok(elements.wandScale < 1);
  equal(elements.wandBottom, 0);
});

test('hoo completion character sits between the completion title and footer buttons', () => {
  const layout = getHooResponsiveLayout({ screenWidth: 390, screenHeight: 844 });
  const bubbleSize = scaleSize(257, layout.width);
  const characterSize = scaleSize(232, layout.width);
  const completion = getHooCompletionCharacterLayout({ layout, bubbleSize, characterSize });
  const titleBottom = scaleY(227, layout.height) + scaleSize(36, layout.width);
  const bottomInset = Math.max(30, scaleSize(38, layout.width));
  const footerTop = layout.screenHeight - bottomInset - scaleY(56, layout.height);
  const idealTop = (titleBottom + footerTop) / 2 - bubbleSize / 2;

  equal(Math.round(completion.bubbleTop), Math.round(idealTop));
  equal(Math.round(completion.characterTop), Math.round(completion.bubbleTop + (bubbleSize - characterSize) / 2));
  ok(completion.bubbleTop > titleBottom);
  ok(completion.bubbleTop + bubbleSize < footerTop);
});

test('hoo completion character stays in the title to button gap on short devices', () => {
  const layout = getHooResponsiveLayout({ screenWidth: 430, screenHeight: 740 });
  const elements = getHooSessionElementLayout(layout);
  const bubbleSize = scaleSize(257, layout.width);
  const characterSize = scaleSize(232, layout.width);
  const completion = getHooCompletionCharacterLayout({ layout, bubbleSize, characterSize });
  const titleBottom = scaleY(227, layout.height) - elements.copyLift + scaleSize(36, layout.width);
  const bottomInset = Math.max(30, scaleSize(38, layout.width));
  const footerTop = layout.screenHeight - bottomInset - scaleY(56, layout.height);
  const idealTop = (titleBottom + footerTop) / 2 - bubbleSize / 2;

  equal(Math.round(completion.bubbleTop), Math.round(idealTop));
  ok(completion.bubbleTop > titleBottom);
  ok(completion.bubbleTop + bubbleSize < footerTop);
});

test('hoo completion buttons use the same bottom inset on regular devices', () => {
  const layout = getHooResponsiveLayout({ screenWidth: 390, screenHeight: 844 });
  const bubbleSize = scaleSize(257, layout.width);
  const characterSize = scaleSize(232, layout.width);
  const buttonWidth = scaleSize(335, layout.width);
  const buttonHeight = scaleY(56, layout.height);
  const bottomInset = Math.max(30, scaleSize(38, layout.width));
  const buttons = getHooCompletionButtonLayout({
    layout,
    bubbleSize,
    characterSize,
    buttonWidth,
    buttonHeight,
  });

  equal(Math.round(buttons.left), Math.round((layout.width - buttonWidth) / 2));
  equal(Math.round(layout.screenHeight - buttons.top - buttons.height), Math.round(bottomInset));
});

test('hoo completion buttons use the same bottom inset on short devices', () => {
  const layout = getHooResponsiveLayout({ screenWidth: 430, screenHeight: 740 });
  const bubbleSize = scaleSize(257, layout.width);
  const characterSize = scaleSize(232, layout.width);
  const buttonWidth = scaleSize(335, layout.width);
  const buttonHeight = scaleY(56, layout.height);
  const bottomInset = Math.max(30, scaleSize(38, layout.width));
  const buttons = getHooCompletionButtonLayout({
    layout,
    bubbleSize,
    characterSize,
    buttonWidth,
    buttonHeight,
  });

  equal(Math.round(layout.screenHeight - buttons.top - buttons.height), Math.round(bottomInset));
});
