import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { equal } from 'node:assert/strict';
import { test } from 'node:test';

function getStyleZIndex(source: string, styleName: string) {
  const styleStart = source.indexOf(`${styleName}: {`);
  const styleSource = source.slice(styleStart);
  const styleEnd = styleSource.indexOf('\n  },');
  const styleBlock = styleEnd >= 0 ? styleSource.slice(0, styleEnd) : styleSource;
  const match = styleBlock.match(/zIndex: (\d+)/);

  return match ? Number(match[1]) : null;
}

test('hoo production UI does not render full Figma frame screenshots as app screens', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('hoo-frame-'), false);
});

test('hoo interactions keep screen transitions quiet and use local bubble audio', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('HOO_TRANSITION_SPRING'), false);
  equal(appSource.includes('sceneSpring'), false);
  equal(appSource.includes('springScene'), false);
  equal(appSource.includes("require('./assets/4.sound effect/hoo-hydrophone-bubbles.mp3')"), true);
  equal(appSource.includes('hoo-bubble-pop.wav'), false);
  equal(appSource.includes('playHooHydrophoneBubbles'), true);
  equal(appSource.includes('prepareHooBubbleSound'), true);
  equal(appSource.includes('const bubbleSoundPoolRef = useRef<Audio.Sound[]>([]);'), true);
  equal(appSource.includes('void prepareHooBubbleSoundFromPress();'), true);
  equal(appSource.includes('prepareHooBubbleSound({ shouldPlay: true, volume: 0 })'), false);
  equal(appSource.includes('if (burst.shouldPlaySound) {'), true);
  equal(appSource.includes('playHooHydrophoneBubbles(bubbleSoundPoolRef, bubbleSoundPoolIndexRef, burst.soundVolume)'), true);
  equal(appSource.includes('await sound.replayAsync();'), true);
  equal(appSource.includes('await sound.setVolumeAsync(Math.max(0.68, Math.min(0.86, volume)))'), true);
  equal(appSource.includes('lastBubbleSoundAtRef'), false);
  equal(appSource.includes('await sound.setVolumeAsync(0.16);'), true);
});

test('hoo completion prepares and plays the achievement sound from the session flow', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const completionSoundEffectSource = appSource.slice(
    appSource.indexOf("if (flowState.screen !== 'complete' || hasPlayedCompletionAchievementForSessionRef.current)"),
    appSource.indexOf('useEffect(() => {\n    if (flowState.screen !==', appSource.indexOf("if (flowState.screen !== 'complete' || hasPlayedCompletionAchievementForSessionRef.current)") + 1),
  );

  equal(appSource.includes("require('./assets/4.sound effect/hoo-completion-achievement.mp3')"), true);
  equal(appSource.includes('async function prepareHooCompletionAchievementSound'), true);
  equal(appSource.includes('async function playPreparedHooCompletionAchievement'), true);
  equal(appSource.includes('const completionAchievementSoundRef = useRef<Audio.Sound | null>(null);'), true);
  equal(appSource.includes('const hasPlayedCompletionAchievementForSessionRef = useRef(false);'), true);
  equal(appSource.includes('prepareHooCompletionAchievementSoundFromPress'), false);
  equal(appSource.includes('prepareHooCompletionAchievementSound({ shouldPlay: true, volume: 0 })'), false);
  equal(completionSoundEffectSource.includes('hasPlayedCompletionAchievementForSessionRef.current = true;'), true);
  equal(completionSoundEffectSource.includes('void playPreparedHooCompletionAchievement(completionAchievementSoundRef);'), true);
  equal(appSource.includes('void playHooCompletionAchievement();'), false);
});

test('hoo session prepares water ambience from the guide press without triggering completion audio', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const requestMicSource = appSource.slice(
    appSource.indexOf('const requestMicPermissionFromPress = useCallback'),
    appSource.indexOf('useEffect(', appSource.indexOf('const requestMicPermissionFromPress = useCallback')),
  );
  const ambienceEffectSource = appSource.slice(
    appSource.indexOf('useEffect(() => {\n    if (!isHooSessionActive)'),
    appSource.indexOf('const hooBubbleContextRef = useRef', appSource.indexOf('useEffect(() => {\n    if (!isHooSessionActive)')),
  );

  equal(appSource.includes('const prepareHooWaterAmbienceSoundFromPress = useCallback(async () => {'), true);
  equal(requestMicSource.includes('void prepareHooBubbleSoundFromPress();'), true);
  equal(requestMicSource.includes('void prepareHooWaterAmbienceSoundFromPress();'), true);
  equal(requestMicSource.includes('prepareHooCompletionAchievementSoundFromPress'), false);
  equal(ambienceEffectSource.includes('let sound = sessionAmbienceRef.current;'), true);
  equal(ambienceEffectSource.includes('sound = await prepareHooWaterAmbienceSound();'), true);
  equal(ambienceEffectSource.includes('await sound.setVolumeAsync(0.16);'), true);
});

test('hoo water ambience becomes audible only after the prepare countdown', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const prepareCountdownSource = appSource.slice(
    appSource.indexOf("if (flowState.screen !== 'prepare' || !hasOpenedMicGate)"),
    appSource.indexOf('const completeBreathingPhase', appSource.indexOf("if (flowState.screen !== 'prepare' || !hasOpenedMicGate)")),
  );
  const ambienceActiveSource = appSource.slice(
    appSource.indexOf('const isHooSessionActive ='),
    appSource.indexOf('function clearCollectionCaptureSheetDelay'),
  );
  const ambienceEffectSource = appSource.slice(
    appSource.indexOf('useEffect(() => {\n    if (!isHooSessionActive)'),
    appSource.indexOf('const hooBubbleContextRef = useRef', appSource.indexOf('useEffect(() => {\n    if (!isHooSessionActive)')),
  );
  const waterPressSource = appSource.slice(
    appSource.indexOf('const prepareHooWaterAmbienceSoundFromPress = useCallback'),
    appSource.indexOf('const requestMicPermissionFromPress = useCallback'),
  );

  equal(prepareCountdownSource.includes('void playHooCountdownDrops();'), true);
  equal(prepareCountdownSource.includes('await sound.setVolumeAsync(0.16);'), false);
  equal(ambienceActiveSource.includes("flowState.screen === 'prepare'"), false);
  equal(ambienceEffectSource.includes('await sound.setVolumeAsync(0.16);'), true);
  equal(waterPressSource.includes('prepareHooWaterAmbienceSound({ shouldPlay: true, volume: 0 })'), false);
  equal(waterPressSource.includes('prepareHooWaterAmbienceSound({ shouldPlay: false, volume: 0 })'), true);
});

test('hoo onboarding shows the full-screen onboarding image immediately', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const hooAppSource = appSource.slice(appSource.indexOf('function HooApp('), appSource.indexOf('// 화면이 마운트될 때'));

  equal(appSource.includes('const HOO_ONBOARDING_AUTO_ADVANCE_MS = 2000;'), true);
  equal(appSource.includes('const HOO_ONBOARDING_FADE_OUT_MS = 520;'), true);
  equal(appSource.includes('function HooAutoAdvanceOnboardingSplash'), true);
  equal(appSource.includes('setTimeout(startExit, HOO_ONBOARDING_AUTO_ADVANCE_MS);'), true);
  equal(appSource.includes("const hooOnboardingImage = require('./assets/5.ui element/hoo-onboarding.png');"), true);
  equal(appSource.includes('hoo-splash-intro.mp4'), false);
  equal(appSource.includes('onboarding-splash-open.mp4'), false);
  equal(hooAppSource.includes('const [flowState, setFlowState] = useState(createInitialHooFlowState);'), true);
  equal(hooAppSource.includes("flowState.screen === 'onboarding'"), true);
  equal(hooAppSource.includes('accessibilityLabel="후우 시작하기"'), true);
  equal(hooAppSource.includes('<HooAutoAdvanceOnboardingSplash onStart={beginSession} />'), true);
  equal(hooAppSource.includes('hooIntroSplashPhase'), false);
  equal(hooAppSource.includes('completeHooIntroSplash'), false);
  equal(hooAppSource.includes('splashOverlayLayer'), false);
  equal(hooAppSource.includes('source={hooLogo}'), false);
  equal(appSource.includes('styles.splashVideo'), false);
  equal(appSource.includes('styles.splashOverlay'), false);
  equal(appSource.includes('rate={1.2}'), false);
  equal(appSource.includes('setRateAsync(1.2, false)'), false);
});

test('hoo controls use tactile press feedback instead of screen-wide spring motion', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('function HooTactilePressable'), true);
  equal(appSource.includes('HOO_SELECTION_COMMIT_DELAY_MS'), true);
  equal(appSource.includes('Animated.spring(sceneSpring'), false);
});

test('hoo breathing stage renders a visible phase countdown and wand entrance', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const sessionStageSource = appSource.slice(
    appSource.indexOf('{showProgress && ('),
    appSource.indexOf('{displayedCopy.titleStyle'),
  );

  equal(appSource.includes('phaseRemainingSeconds'), true);
  equal(appSource.includes('phaseTimerText'), true);
  equal(appSource.includes('breathPhase={flowState.breathPhase}'), true);
  equal(appSource.includes('phaseTimerTextInhale'), true);
  equal(appSource.includes('phaseTimerTextExhale'), true);
  equal(appSource.includes("breathPhase === 'inhale' ? hooStyles.phaseTimerTextInhale : hooStyles.phaseTimerTextExhale"), true);
  equal(appSource.includes('getHooPhaseAdvanceDelayMs'), true);
  equal(appSource.includes('wandEntrance'), true);
  equal(appSource.includes('hasPlayedWandEntranceRef'), true);
  equal(appSource.includes("playWandEntrance={flowState.screen === 'prepare' || flowState.screen === 'breathing'}"), true);
  equal(appSource.includes("playWandEntrance={flowState.screen === 'prepare' && prepareCountdown <= 2}"), false);
  equal(appSource.includes('hasPlayedWandEntranceRef.current ? 1 : 0'), true);
  equal(appSource.includes('stageMotionKey'), false);
  equal(sessionStageSource.includes('floatingBubbleLayer'), true);
  equal(appSource.includes('phaseAccent'), false);
  equal(appSource.includes('phaseAura'), false);
  equal(appSource.includes('phaseTimerInhale'), false);
  equal(appSource.includes('phaseTimerExhale'), false);
  equal(appSource.includes('characterFlight'), true);
  equal(appSource.includes('isCharacterFlying'), true);
  equal(appSource.includes('Animated.loop'), true);
  equal(appSource.includes('hooCounter0'), false);
  equal(appSource.includes('hooCounter1'), false);
  equal(appSource.includes('headerCounterImageFrame'), false);
  equal(appSource.includes('headerCounterTextOverlay'), false);
});

test('hoo session uses the generated background video with the watermark cropped away', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes("require('./assets/5.ui element/hoo-session-bg-video.mp4')"), true);
  equal(appSource.includes("require('./assets/5.ui element/hoo-session-bg-poster.jpg')"), true);
  equal(appSource.includes('source={hooSessionBackgroundVideo}'), true);
  equal(appSource.includes('posterSource={hooSessionBackgroundPoster}'), true);
  equal(appSource.includes('usePoster'), true);
  equal(appSource.includes('hooStyles.sessionBackgroundVideo'), true);
  equal(appSource.includes('resizeMode={ResizeMode.COVER}'), true);
  equal(appSource.includes('shouldPlay'), true);
  equal(appSource.includes('isLooping'), true);
  equal(appSource.includes('isMuted'), true);
  equal(appSource.includes('const sessionBackgroundLiftY = y(96, height);'), true);
  equal(appSource.includes('const sessionBackgroundFrameStyle = {'), true);
  equal(appSource.includes('height: height + sessionBackgroundLiftY,'), true);
  equal(appSource.includes('top: -sessionBackgroundLiftY,'), true);
  equal(appSource.includes('style={[hooStyles.sessionBackgroundVideo, sessionBackgroundFrameStyle]}'), true);
  equal(appSource.includes('posterStyle={[hooStyles.sessionBackgroundVideo, sessionBackgroundFrameStyle]}'), true);
});

test('hoo session background has no hard-edged top wash seam', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('hoo-session-top-wash.png'), false);
  equal(appSource.includes('hoo-session-top-wash-complete.png'), false);
  equal(appSource.includes('hooStyles.sessionTopWash'), false);
  equal(appSource.includes('sessionSurfaceWash'), true);
});

test('hoo desktop frame does not duplicate the session background outside the phone screen', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const appShellSource = appSource.slice(
    appSource.indexOf('<View style={[hooStyles.root'),
    appSource.indexOf('<StatusBar style="light" />'),
  );

  equal(appSource.includes('appFrameLayer'), true);
  equal(appShellSource.includes('{!shouldUseStaticSessionBackground && !isFramed && isHooSessionScreen && ('), true);
  equal(appShellSource.includes('{isHooSessionScreen && ('), false);
});

test('hoo keeps one mounted session stage through prepare breathing and complete', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('isHooSessionScreen'), true);
  equal(appSource.includes("flowState.screen === 'prepare' && ("), false);
  equal(appSource.includes("flowState.screen === 'breathing' && ("), false);
  equal(appSource.includes("flowState.screen === 'complete' && ("), false);
});

test('hoo breathing copy and completion enter with native text fades', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const copyStyleBlock = appSource.slice(
    appSource.indexOf('const hooCopyTransitionStyle'),
    appSource.indexOf('const hooPhaseTimerTransitionStyle'),
  );

  equal(appSource.includes('copyTransition'), true);
  equal(appSource.includes('displayedCopy'), true);
  equal(appSource.includes('exitingCopyTransition'), false);
  equal(appSource.includes('completionEntrance'), true);
  equal(appSource.includes('hooCopyTransitionStyle'), true);
  equal(appSource.includes('getHooSessionCopyAsset'), false);
  equal(appSource.includes('sessionCopyAsset'), false);
  equal(appSource.includes('hooTextInhaleTitle'), false);
  equal(appSource.includes('hooTextInhaleSubtitle'), false);
  equal(appSource.includes('hooTextCompleteTitle'), false);
  equal(appSource.includes('hooTextCompleteSubtitle'), false);
  equal(appSource.includes('source={sessionCopyAsset.title}'), false);
  equal(appSource.includes('source={sessionCopyAsset.subtitle}'), false);
  equal(appSource.includes("flowState.screen === 'breathing'"), true);
  equal(appSource.includes('phaseTimerSubtitleSlot'), true);
  equal(appSource.includes('displayedCopy.subtitle ? ('), true);
  equal(appSource.includes('HOO_SESSION_COPY_IMAGE_SCALE'), false);
  equal(appSource.includes("titleStyle === 'countdown' ? hooStyles.countdownText : hooStyles.instructionTitle"), true);
  equal(appSource.includes('hooStyles.instructionSubtitle'), true);
  equal(appSource.includes('hooExitingCopyTransitionStyle'), false);
  equal(appSource.includes('hooCompletionEntranceStyle'), true);
  equal(appSource.includes('sessionSubtitleGradient'), false);
  equal(appSource.includes('HOO_COPY_FADE_MS'), true);
  equal(appSource.includes('HOO_TIMER_FADE_MS'), true);
  equal(appSource.includes('HOO_COMPLETION_FADE_MS'), true);
  equal(appSource.includes('phaseTimerTransition'), true);
  equal(appSource.includes('displayedPhaseRemainingSeconds'), true);
  equal(appSource.includes('outgoingPhaseRemainingSeconds'), true);
  equal(appSource.includes('hooPhaseTimerIncomingTextStyle'), true);
  equal(appSource.includes('hooPhaseTimerOutgoingTextStyle'), true);
  equal(appSource.includes('phaseTimerTransition.setValue(0);'), true);
  equal(appSource.includes('setDisplayedPhaseRemainingSeconds(phaseRemainingSeconds);'), true);
  equal(copyStyleBlock.includes('translateY'), false);
});

test('hoo session removes duplicated breath meta copy under progress dots', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('지금은 <Text style={hooStyles.breathMetaStrong}>'), false);
  equal(appSource.includes('번째 숨이에요'), false);
  equal(appSource.includes('breathMetaStrong'), false);
});

test('hoo mood selection does not duplicate curved option text', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('hooMoodOptionBusy'), false);
  equal(appSource.includes('hooMoodOptionRest'), false);
  equal(appSource.includes('hooMoodOptionSleep'), false);
  equal(appSource.includes('hooMoodOptionTension'), false);
  equal(appSource.includes('overlaySource'), false);
  equal(appSource.includes('hooMoodTextBusy'), false);
  equal(appSource.includes('hooMoodTextRest'), false);
  equal(appSource.includes('hooMoodTextSleep'), false);
  equal(appSource.includes('hooMoodTextTension'), false);
  equal(appSource.includes('moodTextPathLayer'), false);
  equal(appSource.includes('moodOptionOverlayLayer'), false);
});

test('hoo character appears only from the fifth inhale before final capture', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const characterModeSource = appSource.slice(
    appSource.indexOf('characterMode={'),
    appSource.indexOf('floatingBubbles='),
  );
  const flightStyleSource = appSource.slice(
    appSource.indexOf('const characterFlightStyle'),
    appSource.indexOf('const hooCompletionEntranceStyle'),
  );

  equal(appSource.includes('isFinalBreath'), true);
  equal(appSource.includes('isFinalInhale'), true);
  equal(appSource.includes('isFinalExhale'), true);
  equal(appSource.includes('HOO_FINAL_CAPTURE_BLOW_MS = 1200'), true);
  equal(appSource.includes('finalCaptureAccumMsRef'), true);
  equal(appSource.includes('isFinalCharacterCaptured'), true);
  equal(appSource.includes('finalCaptureAccumMsRef.current >= HOO_FINAL_CAPTURE_BLOW_MS'), true);
  equal(appSource.includes('HOO_BLOW_VOLUME_THRESHOLD'), true);
  equal(characterModeSource.includes("isFinalExhale\n                    ? isFinalCharacterCaptured\n                      ? 'capture'\n                      : 'small'"), true);
  equal(characterModeSource.includes("isFinalInhale"), true);
  equal(characterModeSource.includes("flowState.breathPhase === 'exhale'\\n                      ? 'small'"), false);
  equal(appSource.includes('isFinalCaptureReady'), false);
  equal(appSource.includes('captureFinalCharacterFromPress'), false);
  equal(appSource.includes('finalCaptureTouchTarget'), false);
  equal(appSource.includes('isCharacterFlying={isFinalInhale || (isFinalExhale && !isFinalCharacterCaptured)}'), true);
  equal(appSource.includes('const canAutoAdvanceBreathingPhase = !isFinalExhale || isFinalCharacterCaptured;'), true);
  equal(appSource.includes('Math.random()'), true);
  equal(appSource.includes('characterFlightX'), true);
  equal(appSource.includes('characterFlightY'), true);
  equal(appSource.includes('animateCharacterFlight'), true);
  equal(appSource.includes('Animated.parallel'), true);
  equal(appSource.includes('duration: 860 + Math.random() * 520'), true);
  equal(flightStyleSource.includes('translateX: characterFlightX'), true);
  equal(flightStyleSource.includes('translateY: characterFlightY'), true);
  equal(flightStyleSource.includes("outputRange: ['-12deg', '12deg']"), true);
});

test('hoo fifth breath uses a random generated collection character for capture and completion', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const randomCharacterSource = appSource.slice(
    appSource.indexOf('const hooCollectionCharacters: ImageSourcePropType[] = ['),
    appSource.indexOf('];', appSource.indexOf('const hooCollectionCharacters: ImageSourcePropType[] = [')),
  );
  const randomCharacterCount = randomCharacterSource.match(/collection-generated\/hoo-collection-/g)?.length ?? 0;

  equal(appSource.includes('const hooCollectionCharacters: ImageSourcePropType[] = ['), true);
  equal(randomCharacterCount, 30);
  equal(appSource.includes('collection-generated/empty'), true);
  equal(appSource.includes('chooseRandomHooCollectionSessionCharacter'), true);
  equal(appSource.includes('const [selectedHooCollectionCharacter, setSelectedHooCollectionCharacter] = useState<HooCollectionCharacter>('), true);
  equal(appSource.includes('setSelectedHooCollectionCharacter(chooseRandomHooCollectionSessionCharacter(collectionState));'), true);
  equal(appSource.includes('recordHooCollectionCapture(currentCollectionState, new Date(), selectedHooCollectionCharacter)'), true);
  equal(appSource.includes('setSelectedHooCollectionCharacter(getHooCollectionImageSource(captureResult.capturedCharacter.imageKey));'), false);
  equal(appSource.includes('characterSource={getHooCollectionImageSource(selectedHooCollectionCharacter.imageKey)}'), true);
  equal(appSource.includes('characterSource: ImageSourcePropType;'), true);
  equal(appSource.match(/source={characterSource}/g)?.length, 2);
  equal(appSource.includes('hoo-character-small-node.png'), false);
  equal(appSource.includes('hoo-character-large-node.png'), false);
});

test('hoo completion routes successful captures into the collection flow', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('recordHooCollectionCapture'), true);
  equal(appSource.includes('HOO_COLLECTION_STORAGE_KEY'), true);
  equal(appSource.includes('도감 보기'), true);
  equal(appSource.includes('도감에서 보기'), true);
  equal(appSource.includes('도감에 기록됐어요'), true);
  equal(appSource.includes("flowState.screen === 'collection'"), true);
});

test('hoo completion waits before showing the collection capture sheet', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const captureEffectSource = appSource.slice(
    appSource.indexOf("if (flowState.screen !== 'complete' || hasRecordedCollectionCaptureRef.current)"),
    appSource.indexOf('const isHooSessionScreen =', appSource.indexOf("if (flowState.screen !== 'complete' || hasRecordedCollectionCaptureRef.current)")),
  );
  const captureSheetSource = appSource.slice(
    appSource.indexOf('function HooCollectionCaptureSheet('),
    appSource.indexOf('function HooCollectionScreen('),
  );

  equal(appSource.includes('const HOO_COLLECTION_CAPTURE_SHEET_DELAY_MS = 4200;'), true);
  equal(appSource.includes('const HOO_COLLECTION_CAPTURE_SHEET_SLIDE_MS = 520;'), true);
  equal(appSource.includes('const collectionCaptureSheetDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);'), true);
  equal(captureEffectSource.includes('setIsCollectionCaptureSheetVisible(false);'), true);
  equal(captureEffectSource.includes('collectionCaptureSheetDelayRef.current = setTimeout(() => {'), true);
  equal(captureEffectSource.includes('setIsCollectionCaptureSheetVisible(true);'), true);
  equal(captureEffectSource.includes('}, HOO_COLLECTION_CAPTURE_SHEET_DELAY_MS);'), true);
  equal(captureEffectSource.includes('return () => clearCollectionCaptureSheetDelay();'), true);
  equal(appSource.includes('function clearCollectionCaptureSheetDelay()'), true);
  equal(captureSheetSource.includes('const sheetEnter = useRef(new Animated.Value(0)).current;'), true);
  equal(captureSheetSource.includes('duration: HOO_COLLECTION_CAPTURE_SHEET_SLIDE_MS'), true);
  equal(captureSheetSource.includes('translateY: sheetEnter.interpolate'), true);
  equal(captureSheetSource.includes('<Animated.View'), true);
});

test('hoo collection screen uses generated character and empty collection assets', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const collectionScreenSource = appSource.slice(
    appSource.indexOf('function HooCollectionScreen('),
    appSource.indexOf('const HOO_GUIDE_STEPS = ['),
  );
  const collectionStylesSource = appSource.slice(
    appSource.indexOf('collectionSummaryImageWrap:'),
    appSource.indexOf('floatingBubbleLayer:'),
  );

  equal(appSource.includes("require('./assets/2.collection-generated/hoo-collection-01-butterfly.png')"), true);
  equal(appSource.includes("require('./assets/2.collection-generated/empty/hoo-collection-empty-01-butterfly.png')"), true);
  equal(appSource.includes('HooCollectionScreen'), true);
  equal(appSource.includes('최근 만난 후우'), true);
  equal(collectionScreenSource.includes('숨으로 만난 캐릭터'), false);
  equal(collectionScreenSource.includes('모은 캐릭터'), false);
  equal(collectionScreenSource.includes('const gridGap = x(16, width);'), true);
  equal(collectionScreenSource.includes('top: y(382, height),'), true);
  equal(collectionStylesSource.includes('marginTop: -3'), true);
  equal(collectionStylesSource.includes('width: 92'), true);
  equal(collectionStylesSource.includes('height: 92'), true);
});

test('hoo completion uses a static background image to avoid video remount jank', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const sessionStageSource = appSource.slice(
    appSource.indexOf('function HooSessionStage('),
    appSource.indexOf('function HooFloatingBubble('),
  );

  equal(appSource.includes("const shouldUseStaticSessionBackground = flowState.screen === 'complete';"), true);
  equal(appSource.includes('shouldUseStaticBackground={shouldUseStaticSessionBackground}'), true);
  equal(appSource.includes("!shouldUseStaticSessionBackground && !isFramed && isHooSessionScreen"), true);
  equal(sessionStageSource.includes('shouldUseStaticBackground'), true);
  equal(sessionStageSource.includes('<Image\n          source={hooSessionBackgroundPoster}'), true);
  equal(sessionStageSource.includes('{shouldUseStaticBackground ? ('), true);
});

test('hoo exhale title is the short hoo breath cue', () => {
  const flowSource = readFileSync(join(import.meta.dirname, 'hooFlow.ts'), 'utf8');
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(flowSource.includes("title: '후-우'"), true);
  equal(flowSource.includes("title: '천천히 방울을 불어요'"), false);
  equal(appSource.includes("title === '천천히 방울을 불어요'"), false);
  equal(appSource.includes('hooTextExhaleTitle'), false);
});

test('hoo completion fills all progress dots', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('displayBreathIndex='), false);
  equal(appSource.includes('displayBreathIndex?: number'), false);
  equal(appSource.includes('const visualBreathIndex = breathIndex;'), true);
  equal(appSource.includes("flowState.screen === 'failed'\n                  ? HOO_TOTAL_BREATHS - 1"), false);
});

test('hoo completion removes subtitle and positions the character bubble from layout math', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const completionSubtitleSource = appSource.slice(
    appSource.indexOf('subtitle={'),
    appSource.indexOf('phaseRemainingSeconds=', appSource.indexOf('subtitle={')),
  );

  equal(appSource.includes('getHooCompletionCharacterLayout'), true);
  equal(appSource.includes('completionCharacterLayout.bubbleTop'), true);
  equal(appSource.includes('completionCharacterLayout.characterTop'), true);
  equal(completionSubtitleSource.includes("flowState.screen === 'complete'\n                  ? null"), true);
  equal(appSource.includes('오늘도 나에게 숨 쉴 틈을 줬어요'), false);
  equal(appSource.includes('{ width: bubbleSize, height: bubbleSize, left: x(71, width), top: y(336, height) }'), false);
});

test('hoo completion hides the bubble wand behind the captured character bubble', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const wandRenderSource = appSource.slice(
    appSource.indexOf("{characterMode !== 'large' && ("),
    appSource.indexOf("{characterMode === 'large' && footer", appSource.indexOf("{characterMode !== 'large' && (")),
  );

  equal(appSource.includes('hoo-wand-complete-node.png'), false);
  equal(appSource.includes("source={characterMode === 'large' ? hooWandCompleteNode : hooWandSessionNode}"), false);
  equal(wandRenderSource.includes("{characterMode !== 'large' && ("), true);
  equal(wandRenderSource.includes('source={hooWandSessionNode}'), true);
});

test('hoo prepare counter starts at the first breath instead of zero', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes("breathIndex={flowState.screen === 'prepare' ? 1 : flowState.breathIndex}"), true);
  equal(appSource.includes("breathIndex={flowState.screen === 'prepare' ? 0 : flowState.breathIndex}"), false);
});

test('hoo header counter remounts when the breath index changes', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('key={`hoo-header-counter-${visualBreathIndex}`}'), true);
  equal(appSource.includes('{visualBreathIndex} / {HOO_TOTAL_BREATHS}'), true);
});

test('hoo inhale phase has subtle air particles moving into the wand ring', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('showInhaleFlow'), true);
  equal(appSource.includes("showInhaleFlow={flowState.screen === 'breathing' && flowState.breathPhase === 'inhale'}"), true);
  equal(appSource.includes('inhaleAirParticles'), true);
  equal(appSource.includes('inhaleFlowLayer'), true);
  equal(appSource.includes('inhaleAirParticle'), true);
  equal(appSource.includes('inhaleRingGlow'), true);
  equal(appSource.includes("duration: getHooPhaseDurationMs('inhale')"), true);
  equal(appSource.includes('outputRange: [0, particle.opacity, particle.opacity * 0.5, 0]'), true);
});

test('hoo final capture failure shows a failed session instead of completing', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes("flowState.screen === 'failed'"), true);
  equal(appSource.includes('failHooFinalCapture'), true);
  equal(appSource.includes('방울을 만들지 못했어요'), true);
  equal(appSource.includes('다시 천천히 불어볼까요?'), true);
  equal(appSource.includes('isFinalCaptureBreath && !isFinalCharacterCaptured'), true);
  equal(appSource.includes('setFlowState((currentState) => failHooFinalCapture(currentState));'), true);
});

test('hoo prepare countdown swaps numbers without fading so 2 remains visible', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const copyEffectSource = appSource.slice(
    appSource.indexOf('const nextCopy = { title, subtitle, titleStyle };'),
    appSource.indexOf('useEffect(() => {', appSource.indexOf('phaseTimerValueRef.current')),
  );

  equal(appSource.includes('HOO_COUNTDOWN_COPY_FADE_OUT_MS'), false);
  equal(appSource.includes('HOO_COUNTDOWN_COPY_FADE_IN_MS'), false);
  equal(appSource.includes('hooCountdown3'), false);
  equal(appSource.includes('countdownImage'), false);
  equal(appSource.includes("displayedCopy.title === '3'"), false);
  equal(appSource.includes("currentCopy.titleStyle === 'countdown' && nextCopy.titleStyle === 'countdown'"), true);
  equal(copyEffectSource.includes('if (isCountdownCopyChange) {'), true);
  equal(copyEffectSource.includes('setDisplayedCopy(nextCopy);'), true);
  equal(copyEffectSource.includes('copyTransition.setValue(1);'), true);
  equal(copyEffectSource.includes('return;'), true);
});

test('hoo prepare countdown schedules each number for one second before breathing starts', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const prepareCountdownSource = appSource.slice(
    appSource.indexOf("if (flowState.screen !== 'prepare' || !hasOpenedMicGate)"),
    appSource.indexOf('}, [flowState.screen, flowState.selectedMood, hasOpenedMicGate]);'),
  );

  equal(prepareCountdownSource.includes('const prepareCountdownTimers = ['), true);
  equal(prepareCountdownSource.includes('setTimeout(() => setPrepareCountdown(2), HOO_PREPARE_STEP_MS)'), true);
  equal(prepareCountdownSource.includes('setTimeout(() => setPrepareCountdown(1), HOO_PREPARE_STEP_MS * 2)'), true);
  equal(prepareCountdownSource.includes('setTimeout(() => {'), true);
  equal(prepareCountdownSource.includes('setFlowState((currentState) => startHooBreathing(currentState));'), true);
  equal(prepareCountdownSource.includes('}, HOO_PREPARE_STEP_MS * 3)'), true);
  equal(prepareCountdownSource.includes('setInterval'), false);
});

test('hoo prepare countdown starts the four-beat drop sound with the 3 2 1 timer', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const prepareCountdownSource = appSource.slice(
    appSource.indexOf("if (flowState.screen !== 'prepare' || !hasOpenedMicGate)"),
    appSource.indexOf('}, [flowState.screen, flowState.selectedMood, hasOpenedMicGate]);'),
  );

  equal(appSource.includes("require('./assets/4.sound effect/hoo-countdown-drops.wav')"), true);
  equal(appSource.includes('async function playHooCountdownDrops'), true);
  equal(prepareCountdownSource.includes('void playHooCountdownDrops();'), true);
});

test('hoo idle float uses a visible continuous wave without a top bounce', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const idleFloatSource = appSource.slice(
    appSource.indexOf('function HooIdleFloat'),
    appSource.indexOf('function HooApp'),
  );

  equal(idleFloatSource.includes('inputRange: [0, 0.16, 0.34, 0.5, 0.66, 0.84, 1]'), true);
  equal(idleFloatSource.includes('Easing.linear'), true);
  equal(idleFloatSource.includes('toValue: 0'), false);
  equal(idleFloatSource.includes('amplitudeX * -1'), false);
  equal(idleFloatSource.includes('amplitudeX * -0.08'), true);
  equal(idleFloatSource.includes('amplitudeY * -0.72'), true);
  equal(idleFloatSource.includes('outputRange: [1, 1.004, 1.01, 1.016, 1.01, 1.004, 1]'), true);
  equal(idleFloatSource.includes('scale: floatProgress.interpolate'), true);
});

test('hoo exhale bubbles render layered depth highlights', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const floatingBubbleSource = appSource.slice(
    appSource.indexOf('function HooFloatingBubble'),
    appSource.indexOf('function OnboardingScreen'),
  );

  equal(floatingBubbleSource.includes('floatingBubbleDepthCore'), true);
  equal(floatingBubbleSource.includes('floatingBubbleSpecular'), true);
  equal(floatingBubbleSource.includes('floatingBubbleLowerRim'), true);
});

test('hoo exhale bubbles render visibly above the wand and character artwork', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const floatingBubbleLayerZIndex = getStyleZIndex(appSource, 'floatingBubbleLayer');
  const wandZIndex = getStyleZIndex(appSource, 'hooWand');
  const characterZIndex = getStyleZIndex(appSource, 'hooCharacter');
  const copyZIndex = getStyleZIndex(appSource, 'sessionCopy');

  equal(floatingBubbleLayerZIndex !== null, true);
  equal(wandZIndex !== null, true);
  equal(characterZIndex !== null, true);
  equal(copyZIndex !== null, true);
  equal(floatingBubbleLayerZIndex! > wandZIndex!, true);
  equal(floatingBubbleLayerZIndex! > characterZIndex!, true);
  equal(floatingBubbleLayerZIndex! < copyZIndex!, true);
});

test('hoo creates exhale bubbles from live microphone volume updates and held exhale volume', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const micLevelHandlerStart = appSource.indexOf('const handleHooMicLevel = useCallback((nextVolumeLevel: number) => {');
  const micLevelHandlerSource = appSource.slice(
    micLevelHandlerStart,
    appSource.indexOf('useHooMicrophoneLevel({', micLevelHandlerStart),
  );
  const exhaleIntervalSource = appSource.slice(
    appSource.indexOf("if (!shouldListenToMic) {"),
    appSource.indexOf('useEffect(', appSource.indexOf("if (!shouldListenToMic) {") + 1),
  );

  equal(appSource.includes('const emitHooBubblesFromVolume = useCallback'), true);
  equal(appSource.includes('createHooExhaleBubbleBurst'), true);
  equal(appSource.includes('HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS'), true);
  // 다시하기 직후처럼 마이크 샘플이 잠깐 비는 구간은 실제 숨이 감지된 직후에만 보정한다.
  equal(appSource.includes('const HOO_EXHALE_VOLUME_HOLD_MS = 520;'), true);
  equal(appSource.includes('const HOO_EXHALE_DETECTION_VOLUME_THRESHOLD = 0.012;'), true);
  equal(appSource.includes('exhaleBubbleStateRef'), true);
  equal(appSource.includes('lastDetectedExhaleAtRef'), true);
  equal(appSource.includes('heldExhaleVolumeRef'), true);
  equal(appSource.includes('function resetHooBreathFeedbackState()'), true);
  equal(appSource.includes('const handleHooMicLevel = useCallback((nextVolumeLevel: number) => {'), true);
  equal(appSource.includes('lastBubbleBurstAtRef'), false);
  equal(appSource.includes('createHooBubble({'), false);
  equal(appSource.includes('getHooBubbleBurstCount({'), false);
  equal(micLevelHandlerSource.includes('volumeLevelRef.current = nextVolumeLevel;'), true);
  equal(micLevelHandlerSource.includes('setVolumeLevel(nextVolumeLevel);'), true);
  equal(micLevelHandlerSource.includes('nextVolumeLevel >= HOO_EXHALE_DETECTION_VOLUME_THRESHOLD'), true);
  equal(micLevelHandlerSource.includes('lastDetectedExhaleAtRef.current = Date.now();'), true);
  equal(micLevelHandlerSource.includes('heldExhaleVolumeRef.current = nextVolumeLevel;'), true);
  equal(micLevelHandlerSource.includes('emitHooBubblesFromVolume(nextVolumeLevel);'), false);
  equal(exhaleIntervalSource.includes('setInterval(() => {'), true);
  equal(exhaleIntervalSource.includes('const canUseHeldExhaleVolume = Date.now() - lastDetectedExhaleAtRef.current <= HOO_EXHALE_VOLUME_HOLD_MS;'), true);
  equal(exhaleIntervalSource.includes('emitHooBubblesFromVolume(canUseHeldExhaleVolume ? heldExhaleVolumeRef.current : volumeLevelRef.current);'), true);
  equal(exhaleIntervalSource.includes('emitHooBubblesFromVolume(volumeLevelRef.current, true);'), false);
  equal(appSource.includes('fallbackVolumeLevel:'), false);
  equal(exhaleIntervalSource.includes('HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS'), true);
  equal(appSource.includes('onLevel: handleHooMicLevel'), true);
  equal(appSource.includes('handleHooMicLevel(normalizeHooWebAmplitude(Math.sqrt(sum / samples.length)))'), true);
  equal(appSource.includes('onLevel: setVolumeLevel'), false);
  equal(appSource.includes('setVolumeLevel(normalizeHooWebAmplitude(Math.sqrt(sum / samples.length)))'), false);
  equal(appSource.includes('}, 620);'), false);
});

test('hoo uses one exhale feedback clock and throttles bubble audio independently', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const emitSource = appSource.slice(
    appSource.indexOf('const emitHooBubblesFromVolume = useCallback'),
    appSource.indexOf('const handleHooMicLevel = useCallback'),
  );

  equal(appSource.includes('const bubbleSoundPoolRef = useRef<Audio.Sound[]>([]);'), true);
  equal(appSource.includes('const bubbleSoundPoolIndexRef = useRef(0);'), true);
  equal(appSource.includes('async function prepareHooBubbleSoundPool'), true);
  equal(appSource.includes('lastSoundAtMs: exhaleBubbleStateRef.current.lastSoundAtMs'), true);
  equal(appSource.includes('lastSoundAtMs: burst.nextLastSoundAtMs'), true);
  equal(emitSource.includes('if (burst.shouldPlaySound) {'), true);
  equal(appSource.includes('playHooHydrophoneBubbles(bubbleSoundPoolRef, bubbleSoundPoolIndexRef, burst.soundVolume)'), true);
});

test('hoo stops bubble audio as soon as exhale listening ends', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const exhaleIntervalSource = appSource.slice(
    appSource.indexOf("if (!shouldListenToMic) {"),
    appSource.indexOf('useEffect(', appSource.indexOf("if (!shouldListenToMic) {") + 1),
  );

  equal(appSource.includes('function stopHooBubbleSounds'), true);
  equal(exhaleIntervalSource.includes('stopHooBubbleSounds(bubbleSoundPoolRef);'), true);
  equal(exhaleIntervalSource.includes('return () => {\n      clearInterval(interval);\n      stopHooBubbleSounds(bubbleSoundPoolRef);\n    };'), true);
});

test('hoo first exhale guides users with gentle live feedback only once', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const firstExhaleSource = appSource.slice(
    appSource.indexOf('const [firstExhaleGuideElapsedMs, setFirstExhaleGuideElapsedMs] = useState(0);'),
    appSource.indexOf(
      'useHooMicrophoneLevel({',
      appSource.indexOf('const [firstExhaleGuideElapsedMs, setFirstExhaleGuideElapsedMs] = useState(0);'),
    ),
  );

  equal(appSource.includes("import { HOO_FIRST_EXHALE_DETECTION_THRESHOLD, getHooFirstExhaleGuideCopy } from './hooFirstExhaleGuide';"), true);
  equal(appSource.includes('const [firstExhaleGuideElapsedMs, setFirstExhaleGuideElapsedMs] = useState(0);'), true);
  equal(appSource.includes('const [hasDetectedFirstExhale, setHasDetectedFirstExhale] = useState(false);'), true);
  equal(appSource.includes('const firstExhaleGuideCopy = getHooFirstExhaleGuideCopy({'), true);
  equal(appSource.includes('elapsedMs: firstExhaleGuideElapsedMs,'), true);
  equal(appSource.includes('hasDetectedBreath: hasDetectedFirstExhale,'), true);
  equal(appSource.includes('onFirstExhaleBubbleDetected: () => setHasDetectedFirstExhale(true),'), true);
  equal(firstExhaleSource.includes('onFirstExhaleBubbleDetectedRef.current?.();'), true);
  equal(firstExhaleSource.includes('if (shouldGuideFirstExhale && nextVolumeLevel >= HOO_FIRST_EXHALE_DETECTION_THRESHOLD) {'), true);
  equal(firstExhaleSource.includes('setHasDetectedFirstExhale(true);'), true);
  equal(appSource.includes("setInterval(() => {\n      setFirstExhaleGuideElapsedMs((elapsedMs) => elapsedMs + 100);"), true);
  equal(appSource.includes("subtitle={\n              firstExhaleGuideCopy"), true);
  equal(appSource.includes("'마이크 쪽으로 후-우 불어보세요'"), false);
  equal(appSource.includes("'좋아요, 방울이 생기고 있어요'"), false);
  equal(appSource.includes("'조금 더 길게 후-우'"), false);
  equal(appSource.includes('인식 실패'), false);
  equal(appSource.includes('다시 시도'), false);
  equal(appSource.includes('소리가 작아요'), false);
});

test('hoo guide keeps the three breathing steps as single-line instructions', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const guideStepsSource = appSource.slice(
    appSource.indexOf('const HOO_GUIDE_STEPS = ['),
    appSource.indexOf('];', appSource.indexOf('const HOO_GUIDE_STEPS = [')),
  );

  equal(appSource.includes("title: '천천히 숨 들이마시기'"), true);
  equal(appSource.includes("title: '마이크에 후-우 불기'"), true);
  equal(appSource.includes("title: '마지막엔 큰 방울 만들기'"), true);
  equal(guideStepsSource.includes('sub:'), false);
  equal(appSource.includes('guideStepSub'), false);
  equal(appSource.includes("sub: '코로 편하게 숨을 들이마셔요'"), false);
  equal(appSource.includes("sub: '마이크를 향해 길게 불어주세요'"), false);
  equal(appSource.includes("sub: '캐릭터가 비눗방울 안에 들어와요'"), false);
  equal(appSource.includes("sub: '방울이 될 숨을 모아요'"), false);
});

test('hoo guide start opens the mic gate before starting countdown', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');
  const acknowledgeGuideSource = appSource.slice(
    appSource.indexOf('const acknowledgeGuide = useCallback'),
    appSource.indexOf('const restartSession = () => {'),
  );
  const requestMicPermissionSource = appSource.slice(
    appSource.indexOf('const requestMicPermissionFromPress = useCallback'),
    appSource.indexOf('useEffect(\n    () => () => {'),
  );

  equal(appSource.includes('const [hasOpenedMicGate, setHasOpenedMicGate] = useState(false);'), true);
  equal(appSource.includes("const shouldMeterMic = isMicReady && flowState.screen === 'breathing';"), true);
  equal(appSource.includes('active: shouldMeterMic'), true);
  equal(appSource.includes("const shouldListenToMic = flowState.screen === 'breathing' && flowState.breathPhase === 'exhale';"), true);
  equal(appSource.includes('audioContext.resume()'), true);
  equal(appSource.includes('requestMicPermissionFromPress'), true);
  equal(appSource.includes('async (): Promise<boolean>'), true);
  equal(appSource.includes('const webMicStreamRef = useRef<MediaStream | null>(null);'), true);
  equal(appSource.includes('const startWebMicMetering = useCallback'), true);
  equal(appSource.includes('const updateWebMicLevel = () => {'), true);
  equal(appSource.includes('webMicTimerRef.current = setTimeout(updateWebMicLevel, 80);'), true);
  equal(appSource.includes('webMicStreamRef.current = stream;'), true);
  // 가이드 "시작하기"가 마이크 권한을 요청하고 이번 세션 안내를 닫는다.
  equal(acknowledgeGuideSource.includes('void requestMicPermissionFromPress();'), true);
  equal(acknowledgeGuideSource.includes('setGuideAcknowledged(true);'), true);
  // 권한 팝업을 누르기 전에는 카운트다운과 효과음이 시작되면 안 된다.
  equal(requestMicPermissionSource.includes('setHasOpenedMicGate(didStartMetering);'), true);
  equal(requestMicPermissionSource.includes('setHasOpenedMicGate(permission.granted);'), true);
  equal(requestMicPermissionSource.includes('setHasOpenedMicGate(false);'), true);
  equal(appSource.includes('const [isRequestingMicPermission, setIsRequestingMicPermission] = useState(false);'), true);
  equal(requestMicPermissionSource.includes('setIsRequestingMicPermission(true);'), true);
  equal(requestMicPermissionSource.includes('setIsRequestingMicPermission(false);'), true);
  // 안내 팝업은 세션 시작마다 다시 보이도록 시작 시 리셋한다(영구 저장 X).
  equal(appSource.includes('setGuideAcknowledged(false);'), true);
  equal(appSource.includes("const isGuideOpen = flowState.screen === 'prepare' && !guideAcknowledged;"), true);
  // 무드 선택 화면을 제거하고 온보딩에서 바로 준비 화면으로 진입한다.
  equal(appSource.includes('beginHooSession(currentState)'), true);
  equal(appSource.includes("flowState.screen === 'mood'"), false);
  equal(appSource.includes('setHasOpenedMicGate(true);'), false);
  equal(appSource.includes("if (flowState.screen !== 'prepare' || !hasOpenedMicGate)"), true);
  equal(appSource.includes('showMicPermissionPrompt'), true);
  equal(appSource.includes('micPermissionPill'), true);
  equal(appSource.includes('마이크 허용'), true);
  // 가이드 또는 시스템 권한 팝업이 열려 있는 동안엔 앱 자체 마이크 안내를 띄우지 않는다.
  equal(appSource.includes("const isMicPermissionRequestPending =\n    flowState.screen === 'prepare' && isRequestingMicPermission;"), true);
  equal(appSource.includes("const needsMicPermission =\n    flowState.screen === 'prepare' && !isGuideOpen && !isRequestingMicPermission && !hasOpenedMicGate && !isMicReady;"), true);
  equal(appSource.includes('&& !isRequestingMicPermission'), true);
  equal(appSource.includes("isMicPermissionRequestPending\n                ? ''"), true);
  equal(appSource.includes('showMicPermissionPrompt={needsMicPermission}'), true);
  equal(appSource.includes("titleStyle={needsMicPermission ? 'instruction' : flowState.screen === 'prepare' ? 'countdown' : 'instruction'}"), true);
});

test('hoo complete buttons avoid duplicate baked-in image labels', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('source={hooCompleteButtons}'), false);
  equal(appSource.includes('completeButtonShape'), true);
});

test('hoo source no longer exposes luno branding or storage namespace', () => {
  const appSource = readFileSync(join(import.meta.dirname, 'App.tsx'), 'utf8');

  equal(appSource.includes('Luno'), false);
  equal(appSource.includes('luno.'), false);
});
