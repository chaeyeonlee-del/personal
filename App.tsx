import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, ResizeMode, Video, type AVPlaybackSource } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  ImageSourcePropType,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import {
  createGuestAuthState,
  isAuthState,
  shouldOfferLogin,
  type AuthProvider,
  type AuthState,
} from './authState';
import { getPreviewAuthConnection } from './authProviders';
import {
  createSessionRecord,
  getCurrentStreak,
  getWeeklyRecordSummary,
  getWeekCheckIns,
  markDailyCheckIn,
  prepareSignedInSessionRecords,
  sortSessionRecordsNewestFirst,
  type DailyCheckIn,
  type SessionRecord,
  type WeekCheckInDay,
} from './checkins';
import { createGlassSurface } from './glassStyles';
import {
  HOO_BLOW_VOLUME_THRESHOLD,
  normalizeHooMetering,
  normalizeHooWebAmplitude,
  type HooBubble,
} from './hooBubbles';
import {
  HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS,
  createHooExhaleBubbleBurst,
} from './hooExhaleBubbles';
import { HOO_FIRST_EXHALE_DETECTION_THRESHOLD, getHooFirstExhaleGuideCopy } from './hooFirstExhaleGuide';
import {
  beginHooSession,
  createInitialHooFlowState,
  failHooFinalCapture,
  getHooPhaseCopy,
  progressHooFlow,
  restartHooBreathing,
  startHooBreathing,
  type HooBreathPhase,
  type HooFlowState,
  type HooMood,
} from './hooFlow';
import {
  chooseRandomHooCollectionSessionCharacter,
  createInitialHooCollectionState,
  getHooCollectionSummary,
  getHooCollectionViewItems,
  parseStoredHooCollectionState,
  recordHooCollectionCapture,
  type HooCollectionSummary,
  type HooCollectionState,
} from './hooCollection';
import type { HooCollectionCategory, HooCollectionCharacter } from './hooCollectionCatalog';
import {
  getHooCompletionButtonLayout,
  getHooCompletionCharacterLayout,
  getHooResponsiveLayout,
  getHooSessionElementLayout,
} from './hooResponsiveLayout';
import {
  HOO_PREPARE_STEP_MS,
  HOO_TOTAL_BREATHS,
  createHooPhaseCountdownValues,
  createHooPrepareCountdownValues,
  getHooPhaseAdvanceDelayMs,
  getHooPhaseDurationMs,
  isHooFinalBreath,
} from './hooSessionRules';
import { createGuestUserId, isGuestUserId } from './localUser';
import {
  addMinutesToRoutineTime,
  createRoutineReminder,
  formatRoutineTime,
  type RoutineReminder,
} from './routineReminder';
import { getSoundToggleLabel, toDefaultSoundLabel } from './sessionAudio';
import { getSupabaseConfig, syncSessionRecordsToSupabase, syncSessionRecordToSupabase } from './supabaseRecords';

const FIGMA_WIDTH = 390;
const FIGMA_HEIGHT = 844;
const pauseIcon = require('./assets/5.ui element/material-symbols_pause.png');
const playIcon = require('./assets/5.ui element/mdi_play.png');
const backgroundVideo = require('./assets/5.ui element/hoo-session-bg-video.mp4');
const calmRiverSessionVideo = require('./assets/5.ui element/hoo-session-bg-video.mp4');
const onboardingCloudTicketBg = require('./assets/5.ui element/onboarding-cloud-ticket-bg.png');
const airCardIceland = require('./assets/5.ui element/hoo-mood-character-sea.png');
const airCardJapan = require('./assets/5.ui element/hoo-mood-character-flower.png');
const airCardMorocco = require('./assets/5.ui element/hoo-mood-character-clover.png');
const airCardSwitzerland = require('./assets/5.ui element/hoo-mood-character-sleep.png');
const hooOnboardingImage = require('./assets/5.ui element/hoo-onboarding.png');
const hooMoodBackground = require('./assets/5.ui element/hoo-mood-bg.png');
const hooBubbleRim = require('./assets/3.session-bubbles/hoo-bubble-rim.png');
const hooBubbleSelected = require('./assets/3.session-bubbles/hoo-bubble-selected.png');
const hooMoodCharacterFlower = require('./assets/5.ui element/hoo-mood-character-flower.png');
const hooMoodCharacterSea = require('./assets/5.ui element/hoo-mood-character-sea.png');
const hooMoodCharacterClover = require('./assets/5.ui element/hoo-mood-character-clover.png');
const hooMoodCharacterSleep = require('./assets/5.ui element/hoo-mood-character-sleep.png');
const hooSessionBackgroundVideo = require('./assets/5.ui element/hoo-session-bg-video.mp4');
const hooSessionBackgroundPoster = require('./assets/5.ui element/hoo-session-bg-poster.jpg');
const hooLogo = require('./assets/1.branding/hoo-logo.png');
const hooWand = require('./assets/5.ui element/hoo-wand.png');
const hooWandSessionNode = require('./assets/5.ui element/hoo-wand-session-node.png');
const hooLogoHeaderNode = require('./assets/1.branding/hoo-logo-header-node.png');
const hooCompleteBubbleNode = require('./assets/3.session-bubbles/hoo-complete-bubble-node.png');
const hooCollectionCharacters: ImageSourcePropType[] = [
  require('./assets/2.collection-generated/hoo-collection-01-butterfly.png'),
  require('./assets/2.collection-generated/hoo-collection-02-sparrow.png'),
  require('./assets/2.collection-generated/hoo-collection-03-rainbow-jellyfish.png'),
  require('./assets/2.collection-generated/hoo-collection-04-ladybug-leaf.png'),
  require('./assets/2.collection-generated/hoo-collection-06-tropical-flower-b.png'),
  require('./assets/2.collection-generated/hoo-collection-07-sunset-seahorse.png'),
  require('./assets/2.collection-generated/hoo-collection-08-blue-snail.png'),
  require('./assets/2.collection-generated/hoo-collection-09-peacock-feather.png'),
  require('./assets/2.collection-generated/hoo-collection-10-rainbow-seashell.png'),
  require('./assets/2.collection-generated/hoo-collection-11-sleepy-bluebird.png'),
  require('./assets/2.collection-generated/hoo-collection-12-strawberry-sprout.png'),
  require('./assets/2.collection-generated/hoo-collection-13-coral-branch.png'),
  require('./assets/2.collection-generated/hoo-collection-14-dazed-snowflake.png'),
  require('./assets/2.collection-generated/hoo-collection-15-flame-sunset.png'),
  require('./assets/2.collection-generated/hoo-collection-16-extra-colorful.png'),
  require('./assets/2.collection-generated/hoo-collection-17-sleepy-moon-cloud.png'),
  require('./assets/2.collection-generated/hoo-collection-18-sea-cucumber.png'),
  require('./assets/2.collection-generated/hoo-collection-19-sleepy-mushroom.png'),
  require('./assets/2.collection-generated/hoo-collection-20-grumpy-kelp.png'),
  require('./assets/2.collection-generated/hoo-collection-21-goofy-starfish.png'),
  require('./assets/2.collection-generated/hoo-collection-22-sleepy-pebbles.png'),
  require('./assets/2.collection-generated/hoo-collection-23-surprised-raindrop.png'),
  require('./assets/2.collection-generated/hoo-collection-24-sleepy-manta-ray.png'),
  require('./assets/2.collection-generated/hoo-collection-25-blank-acorn.png'),
  require('./assets/2.collection-generated/hoo-collection-27-dozing-seashell.png'),
  require('./assets/2.collection-generated/hoo-collection-28-windsock-sky.png'),
  require('./assets/2.collection-generated/hoo-collection-29-sleepy-lotus.png'),
  require('./assets/2.collection-generated/hoo-collection-30-coral-branch-alt.png'),
  require('./assets/2.collection-generated/hoo-collection-31-sleepy-pinecone.png'),
  require('./assets/2.collection-generated/hoo-collection-32-dazed-snowflake-alt.png'),
];
const hooCollectionImageSources: Record<string, ImageSourcePropType> = {
  'hoo-collection-01-butterfly': require('./assets/2.collection-generated/hoo-collection-01-butterfly.png'),
  'hoo-collection-02-sparrow': require('./assets/2.collection-generated/hoo-collection-02-sparrow.png'),
  'hoo-collection-03-rainbow-jellyfish': require('./assets/2.collection-generated/hoo-collection-03-rainbow-jellyfish.png'),
  'hoo-collection-04-ladybug-leaf': require('./assets/2.collection-generated/hoo-collection-04-ladybug-leaf.png'),
  'hoo-collection-06-tropical-flower-b': require('./assets/2.collection-generated/hoo-collection-06-tropical-flower-b.png'),
  'hoo-collection-07-sunset-seahorse': require('./assets/2.collection-generated/hoo-collection-07-sunset-seahorse.png'),
  'hoo-collection-08-blue-snail': require('./assets/2.collection-generated/hoo-collection-08-blue-snail.png'),
  'hoo-collection-09-peacock-feather': require('./assets/2.collection-generated/hoo-collection-09-peacock-feather.png'),
  'hoo-collection-10-rainbow-seashell': require('./assets/2.collection-generated/hoo-collection-10-rainbow-seashell.png'),
  'hoo-collection-11-sleepy-bluebird': require('./assets/2.collection-generated/hoo-collection-11-sleepy-bluebird.png'),
  'hoo-collection-12-strawberry-sprout': require('./assets/2.collection-generated/hoo-collection-12-strawberry-sprout.png'),
  'hoo-collection-13-coral-branch': require('./assets/2.collection-generated/hoo-collection-13-coral-branch.png'),
  'hoo-collection-14-dazed-snowflake': require('./assets/2.collection-generated/hoo-collection-14-dazed-snowflake.png'),
  'hoo-collection-15-flame-sunset': require('./assets/2.collection-generated/hoo-collection-15-flame-sunset.png'),
  'hoo-collection-16-extra-colorful': require('./assets/2.collection-generated/hoo-collection-16-extra-colorful.png'),
  'hoo-collection-17-sleepy-moon-cloud': require('./assets/2.collection-generated/hoo-collection-17-sleepy-moon-cloud.png'),
  'hoo-collection-18-sea-cucumber': require('./assets/2.collection-generated/hoo-collection-18-sea-cucumber.png'),
  'hoo-collection-19-sleepy-mushroom': require('./assets/2.collection-generated/hoo-collection-19-sleepy-mushroom.png'),
  'hoo-collection-20-grumpy-kelp': require('./assets/2.collection-generated/hoo-collection-20-grumpy-kelp.png'),
  'hoo-collection-21-goofy-starfish': require('./assets/2.collection-generated/hoo-collection-21-goofy-starfish.png'),
  'hoo-collection-22-sleepy-pebbles': require('./assets/2.collection-generated/hoo-collection-22-sleepy-pebbles.png'),
  'hoo-collection-23-surprised-raindrop': require('./assets/2.collection-generated/hoo-collection-23-surprised-raindrop.png'),
  'hoo-collection-24-sleepy-manta-ray': require('./assets/2.collection-generated/hoo-collection-24-sleepy-manta-ray.png'),
  'hoo-collection-25-blank-acorn': require('./assets/2.collection-generated/hoo-collection-25-blank-acorn.png'),
  'hoo-collection-27-dozing-seashell': require('./assets/2.collection-generated/hoo-collection-27-dozing-seashell.png'),
  'hoo-collection-28-windsock-sky': require('./assets/2.collection-generated/hoo-collection-28-windsock-sky.png'),
  'hoo-collection-29-sleepy-lotus': require('./assets/2.collection-generated/hoo-collection-29-sleepy-lotus.png'),
  'hoo-collection-30-coral-branch-alt': require('./assets/2.collection-generated/hoo-collection-30-coral-branch-alt.png'),
  'hoo-collection-31-sleepy-pinecone': require('./assets/2.collection-generated/hoo-collection-31-sleepy-pinecone.png'),
  'hoo-collection-32-dazed-snowflake-alt': require('./assets/2.collection-generated/hoo-collection-32-dazed-snowflake-alt.png'),
  'hoo-collection-empty-01-butterfly': require('./assets/2.collection-generated/empty/hoo-collection-empty-01-butterfly.png'),
  'hoo-collection-empty-02-sparrow': require('./assets/2.collection-generated/empty/hoo-collection-empty-02-sparrow.png'),
  'hoo-collection-empty-03-rainbow-jellyfish': require('./assets/2.collection-generated/empty/hoo-collection-empty-03-rainbow-jellyfish.png'),
  'hoo-collection-empty-04-ladybug-leaf': require('./assets/2.collection-generated/empty/hoo-collection-empty-04-ladybug-leaf.png'),
  'hoo-collection-empty-06-tropical-flower-b': require('./assets/2.collection-generated/empty/hoo-collection-empty-06-tropical-flower-b.png'),
  'hoo-collection-empty-07-sunset-seahorse': require('./assets/2.collection-generated/empty/hoo-collection-empty-07-sunset-seahorse.png'),
  'hoo-collection-empty-08-blue-snail': require('./assets/2.collection-generated/empty/hoo-collection-empty-08-blue-snail.png'),
  'hoo-collection-empty-09-peacock-feather': require('./assets/2.collection-generated/empty/hoo-collection-empty-09-peacock-feather.png'),
  'hoo-collection-empty-10-rainbow-seashell': require('./assets/2.collection-generated/empty/hoo-collection-empty-10-rainbow-seashell.png'),
  'hoo-collection-empty-11-sleepy-bluebird': require('./assets/2.collection-generated/empty/hoo-collection-empty-11-sleepy-bluebird.png'),
  'hoo-collection-empty-12-strawberry-sprout': require('./assets/2.collection-generated/empty/hoo-collection-empty-12-strawberry-sprout.png'),
  'hoo-collection-empty-13-coral-branch': require('./assets/2.collection-generated/empty/hoo-collection-empty-13-coral-branch.png'),
  'hoo-collection-empty-14-dazed-snowflake': require('./assets/2.collection-generated/empty/hoo-collection-empty-14-dazed-snowflake.png'),
  'hoo-collection-empty-15-flame-sunset': require('./assets/2.collection-generated/empty/hoo-collection-empty-15-flame-sunset.png'),
  'hoo-collection-empty-16-extra-colorful': require('./assets/2.collection-generated/empty/hoo-collection-empty-16-extra-colorful.png'),
  'hoo-collection-empty-17-sleepy-moon-cloud': require('./assets/2.collection-generated/empty/hoo-collection-empty-17-sleepy-moon-cloud.png'),
  'hoo-collection-empty-18-sea-cucumber': require('./assets/2.collection-generated/empty/hoo-collection-empty-18-sea-cucumber.png'),
  'hoo-collection-empty-19-sleepy-mushroom': require('./assets/2.collection-generated/empty/hoo-collection-empty-19-sleepy-mushroom.png'),
  'hoo-collection-empty-20-grumpy-kelp': require('./assets/2.collection-generated/empty/hoo-collection-empty-20-grumpy-kelp.png'),
  'hoo-collection-empty-21-goofy-starfish': require('./assets/2.collection-generated/empty/hoo-collection-empty-21-goofy-starfish.png'),
  'hoo-collection-empty-22-sleepy-pebbles': require('./assets/2.collection-generated/empty/hoo-collection-empty-22-sleepy-pebbles.png'),
  'hoo-collection-empty-23-surprised-raindrop': require('./assets/2.collection-generated/empty/hoo-collection-empty-23-surprised-raindrop.png'),
  'hoo-collection-empty-24-sleepy-manta-ray': require('./assets/2.collection-generated/empty/hoo-collection-empty-24-sleepy-manta-ray.png'),
  'hoo-collection-empty-25-blank-acorn': require('./assets/2.collection-generated/empty/hoo-collection-empty-25-blank-acorn.png'),
  'hoo-collection-empty-27-dozing-seashell': require('./assets/2.collection-generated/empty/hoo-collection-empty-27-dozing-seashell.png'),
  'hoo-collection-empty-28-windsock-sky': require('./assets/2.collection-generated/empty/hoo-collection-empty-28-windsock-sky.png'),
  'hoo-collection-empty-29-sleepy-lotus': require('./assets/2.collection-generated/empty/hoo-collection-empty-29-sleepy-lotus.png'),
  'hoo-collection-empty-30-coral-branch-alt': require('./assets/2.collection-generated/empty/hoo-collection-empty-30-coral-branch-alt.png'),
  'hoo-collection-empty-31-sleepy-pinecone': require('./assets/2.collection-generated/empty/hoo-collection-empty-31-sleepy-pinecone.png'),
  'hoo-collection-empty-32-dazed-snowflake-alt': require('./assets/2.collection-generated/empty/hoo-collection-empty-32-dazed-snowflake-alt.png'),
};
const hooProgress1 = require('./assets/5.ui element/hoo-progress-1.png');
const hooProgressDot = require('./assets/5.ui element/hoo-progress-dot.png');
const hooProgressDotActive = require('./assets/5.ui element/hoo-progress-dot-active.png');
const hooTextMetaBreath1 = require('./assets/5.ui element/hoo-text-meta-breath-1.png');
const hooCompleteButtons = require('./assets/5.ui element/hoo-complete-buttons.png');
const hooBackChevron = require('./assets/5.ui element/hoo-back-chevron.png');
const hooCountdownDropsSound = require('./assets/4.sound effect/hoo-countdown-drops.wav');
const hooHydrophoneBubblesSound = require('./assets/4.sound effect/hoo-hydrophone-bubbles.mp3');
const hooCompletionAchievementSound = require('./assets/4.sound effect/hoo-completion-achievement.mp3');
const hooWaterAmbienceSound = require('./assets/4.sound effect/hoo-water-ambience.mp3');
const ONBOARDING_SPLASH_FALLBACK_MS = 2200;
const CHECK_INS_STORAGE_KEY = 'hoo.dailyCheckIns.v1';
const SESSION_RECORDS_STORAGE_KEY = 'hoo.sessionRecords.v1';
const HOO_COLLECTION_STORAGE_KEY = 'hoo.collection.v1';
const ROUTINE_REMINDER_STORAGE_KEY = 'hoo.routineReminder.v1';
const GUEST_USER_STORAGE_KEY = 'hoo.guestUserId.v1';
const AUTH_STATE_STORAGE_KEY = 'hoo.authState.v1';
const HOO_INITIAL_PREPARE_COUNTDOWN = createHooPrepareCountdownValues()[0];
const HOO_SELECTION_COMMIT_DELAY_MS = 90;
const HOO_COLLECTION_CAPTURE_SHEET_DELAY_MS = 4200;
const HOO_COLLECTION_CAPTURE_SHEET_SLIDE_MS = 520;
const HOO_EXHALE_VOLUME_HOLD_MS = 520;
const HOO_EXHALE_DETECTION_VOLUME_THRESHOLD = 0.012;
const HOO_BUBBLE_SOUND_POOL_SIZE = 3;
const HOO_TACTILE_PRESS_IN_MS = 80;
const HOO_TACTILE_PRESS_OUT_MS = 165;
const HOO_COPY_FADE_MS = 760;
const HOO_TIMER_FADE_MS = 520;
const HOO_COMPLETION_FADE_MS = 720;
const HOO_FINAL_CAPTURE_BLOW_MS = 1200;
const glassSoft = createGlassSurface('soft', Platform.OS) as any;
const glassRegular = createGlassSurface('regular', Platform.OS) as any;
const glassStrong = createGlassSurface('strong', Platform.OS) as any;

type ScreenName = 'onboarding' | 'arrival' | 'destination' | 'select' | 'prepare' | 'breathing' | 'complete' | 'records' | 'routine';

type OnboardingPhase = 'splash' | 'transition' | 'ticket';
type Session = {
  id: string;
  destination: string;
  title: string;
  description: string;
  durationMinutes: number;
  rhythm: string;
  focus: string;
  sound: string;
  mapX: number;
  mapY: number;
  gradient: [string, string, string];
  completeGradient: [string, string, string];
  completionMessage: string;
  video: AVPlaybackSource;
};

type Destination = {
  id: string;
  country: string;
  title: string;
  mood: string;
  sessionId: string;
  cardImage: ImageSourcePropType;
  previewVideo?: AVPlaybackSource;
  palette: {
    background: [string, string, string];
    ocean: string;
    land: string;
    glow: string;
    accent: string;
    panel: string;
  };
};

const sessions: Session[] = [
  {
    id: 'korea-rain',
    destination: 'Korea Rain',
    title: 'For when anxiety spikes',
    description: 'Soft rain and a steady rhythm for sudden tension.',
    durationMinutes: 3,
    rhythm: '4-4-4-4',
    focus: 'Let go of tension',
    sound: 'Rain',
    mapX: 274,
    mapY: 276,
    gradient: ['#EAF1F2', '#A9BBC0', '#496957'],
    completeGradient: ['#F6F2E8', '#D9E2DE', '#7E907E'],
    completionMessage: "Well done. You've taken care of yourself.",
    video: backgroundVideo,
  },
  {
    id: 'iceland-water',
    destination: 'Iceland Water',
    title: 'For when you need clarity',
    description: 'Cool water and a longer exhale to clear the noise.',
    durationMinutes: 5,
    rhythm: '4-0-6-0',
    focus: 'Clear mental noise',
    sound: 'Ocean',
    mapX: 104,
    mapY: 572,
    gradient: ['#EFF7F8', '#9FBEC5', '#305E6B'],
    completeGradient: ['#F4F8F8', '#D6E8EA', '#7194A0'],
    completionMessage: 'You made space between your thoughts.',
    video: calmRiverSessionVideo,
  },
  {
    id: 'finland-night',
    destination: 'Finland Night',
    title: "For when your mind won't stop",
    description: 'A quiet night route for slowing down before rest.',
    durationMinutes: 7,
    rhythm: '4-7-8-0',
    focus: 'Ease into sleep',
    sound: 'Night Forest',
    mapX: 286,
    mapY: 624,
    gradient: ['#E8EEF5', '#607B97', '#17243E'],
    completeGradient: ['#F8F4ED', '#E5D8C4', '#909987'],
    completionMessage: 'Arrived softly. Let the day get quieter.',
    video: backgroundVideo,
  },
];

const destinations: Destination[] = [
  {
    id: 'korea-rain',
    country: 'Korea',
    title: 'Korea Rain',
    mood: 'A steady route for sudden tension.',
    sessionId: 'korea-rain',
    cardImage: airCardJapan,
    palette: {
      background: ['#F7FAF8', '#DDE8E1', '#F2F1EA'],
      ocean: '#9FB7AE',
      land: '#516F58',
      glow: '#DCEBE2',
      accent: '#748B72',
      panel: 'rgba(255,255,255,0.78)',
    },
  },
  {
    id: 'iceland-water',
    country: 'Iceland',
    title: 'Iceland Water',
    mood: 'Cool air and a clean exhale.',
    sessionId: 'iceland-water',
    cardImage: airCardIceland,
    previewVideo: calmRiverSessionVideo,
    palette: {
      background: ['#F7FBFC', '#D9EEF2', '#F5F7F2'],
      ocean: '#95BECA',
      land: '#315E6C',
      glow: '#DDF7FB',
      accent: '#537F8A',
      panel: 'rgba(255,255,255,0.76)',
    },
  },
  {
    id: 'finland-night',
    country: 'Finland',
    title: 'Finland Night',
    mood: 'A quieter route before rest.',
    sessionId: 'finland-night',
    cardImage: airCardSwitzerland,
    palette: {
      background: ['#F2F5FA', '#D9E0EC', '#F6F0E8'],
      ocean: '#647FA0',
      land: '#17243E',
      glow: '#DCE5FF',
      accent: '#526A8F',
      panel: 'rgba(255,255,255,0.75)',
    },
  },
  {
    id: 'japan-sakura',
    country: 'Japan',
    title: 'Japan Sakura',
    mood: 'Soft focus with a gentle reset.',
    sessionId: 'korea-rain',
    cardImage: airCardJapan,
    palette: {
      background: ['#FCF8F8', '#F2DEE2', '#F5F0E9'],
      ocean: '#D9AEB8',
      land: '#8B6870',
      glow: '#FFE6EC',
      accent: '#B7838F',
      panel: 'rgba(255,255,255,0.78)',
    },
  },
  {
    id: 'norway-aurora',
    country: 'Norway',
    title: 'Norway Aurora',
    mood: 'Slow wonder for a busy mind.',
    sessionId: 'finland-night',
    cardImage: airCardSwitzerland,
    palette: {
      background: ['#F3F8F8', '#D8E8E8', '#EEF1EA'],
      ocean: '#76A8A6',
      land: '#244A55',
      glow: '#BDE8D8',
      accent: '#4B8A7D',
      panel: 'rgba(255,255,255,0.76)',
    },
  },
  {
    id: 'new-zealand-forest',
    country: 'New Zealand',
    title: 'New Zealand Forest',
    mood: 'Grounding breaths with green depth.',
    sessionId: 'korea-rain',
    cardImage: airCardSwitzerland,
    palette: {
      background: ['#F4F8F2', '#DCE9D6', '#F6F2EA'],
      ocean: '#91AE8B',
      land: '#385C42',
      glow: '#DDF0D7',
      accent: '#617E5A',
      panel: 'rgba(255,255,255,0.77)',
    },
  },
  {
    id: 'morocco-desert',
    country: 'Morocco',
    title: 'Morocco Desert',
    mood: 'Warm clarity and a longer pause.',
    sessionId: 'iceland-water',
    cardImage: airCardMorocco,
    palette: {
      background: ['#FBF7EF', '#EAD9BE', '#F5EFE7'],
      ocean: '#C99D6C',
      land: '#8D5E3D',
      glow: '#FFE4BC',
      accent: '#AA7952',
      panel: 'rgba(255,255,255,0.78)',
    },
  },
  {
    id: 'switzerland-alpine',
    country: 'Switzerland',
    title: 'Switzerland Alpine',
    mood: 'Clear mountain air for focus.',
    sessionId: 'iceland-water',
    cardImage: airCardSwitzerland,
    palette: {
      background: ['#F8FAF9', '#DDE8E8', '#F3F1EA'],
      ocean: '#A9BFC0',
      land: '#60797B',
      glow: '#E5F4F4',
      accent: '#70898A',
      panel: 'rgba(255,255,255,0.78)',
    },
  },
  {
    id: 'greece-sea',
    country: 'Greece',
    title: 'Greece Sea',
    mood: 'Open horizon for a lighter chest.',
    sessionId: 'iceland-water',
    cardImage: airCardIceland,
    palette: {
      background: ['#F5FAFC', '#D8EDF5', '#F7F4EC'],
      ocean: '#79B5D0',
      land: '#2E6F90',
      glow: '#D7F0FF',
      accent: '#4C8FB0',
      panel: 'rgba(255,255,255,0.76)',
    },
  },
  {
    id: 'france-lavender',
    country: 'France',
    title: 'France Lavender',
    mood: 'A soft evening route to unwind.',
    sessionId: 'finland-night',
    cardImage: airCardMorocco,
    palette: {
      background: ['#F8F5FA', '#E5DDEE', '#F5F1EA'],
      ocean: '#A79AC2',
      land: '#6E628C',
      glow: '#E8DFFF',
      accent: '#8170A0',
      panel: 'rgba(255,255,255,0.77)',
    },
  },
];

const phaseLabels = ['Inhale', 'Hold', 'Exhale', 'Rest'];
const phaseScales = [1, 0.92, 0.58, 0.58];

type BreathPhase = {
  label: string;
  seconds: number;
  scale: number;
};

function getBreathPhases(rhythm: string): BreathPhase[] {
  return rhythm
    .split('-')
    .map((part, index) => ({
      label: phaseLabels[index] ?? 'Breathe',
      seconds: Number(part),
      scale: phaseScales[index] ?? 0.7,
    }))
    .filter((phase) => phase.seconds > 0);
}

function x(value: number, width: number) {
  return (value / FIGMA_WIDTH) * width;
}

function y(value: number, height: number) {
  return (value / FIGMA_HEIGHT) * height;
}

function s(value: number, width: number) {
  return (value / FIGMA_WIDTH) * width;
}

type BrowserStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

function getBrowserStorage() {
  try {
    return (globalThis as { localStorage?: BrowserStorage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function parseStoredCheckIns(storedValue: string | null): DailyCheckIn[] {
  try {
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (record): record is DailyCheckIn =>
        typeof record?.date === 'string' &&
        record.completed === true &&
        typeof record?.completedAt === 'string',
    );
  } catch {
    return [];
  }
}

function parseStoredSessionRecords(storedValue: string | null): SessionRecord[] {
  try {
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (record): record is SessionRecord =>
        typeof record?.record_id === 'string' &&
        typeof record?.user_id === 'string' &&
        typeof record?.session_id === 'string' &&
        typeof record?.session_name === 'string' &&
        typeof record?.started_at === 'string' &&
        typeof record?.completed_at === 'string' &&
        typeof record?.duration_seconds === 'number' &&
        record.completed === true,
    );
  } catch {
    return [];
  }
}

function parseStoredRoutineReminder(storedValue: string | null): RoutineReminder | null {
  try {
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;

    if (
      parsedValue?.enabled === true &&
      parsedValue.frequency === 'daily' &&
      typeof parsedValue.hour === 'number' &&
      typeof parsedValue.minute === 'number' &&
      typeof parsedValue.created_at === 'string'
    ) {
      return parsedValue;
    }

    return null;
  } catch {
    return null;
  }
}

function parseStoredAuthState(storedValue: string | null): AuthState | null {
  try {
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;

    return isAuthState(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function readStoredCheckIns(): DailyCheckIn[] {
  if (Platform.OS !== 'web') {
    return [];
  }

  return parseStoredCheckIns(getBrowserStorage()?.getItem(CHECK_INS_STORAGE_KEY) ?? null);
}

function persistStoredValue(key: string, value: unknown) {
  const serializedValue = JSON.stringify(value);

  if (Platform.OS === 'web') {
    try {
      getBrowserStorage()?.setItem(key, serializedValue);
    } catch {
      // Local persistence should not block the breathing flow.
    }
    return;
  }

  void AsyncStorage.setItem(key, serializedValue).catch(() => {
    // Native local persistence is best effort for the prototype.
  });
}

function persistCheckIns(records: DailyCheckIn[]) {
  persistStoredValue(CHECK_INS_STORAGE_KEY, records);
}

function readStoredSessionRecords(): SessionRecord[] {
  if (Platform.OS !== 'web') {
    return [];
  }

  return parseStoredSessionRecords(getBrowserStorage()?.getItem(SESSION_RECORDS_STORAGE_KEY) ?? null);
}

function persistSessionRecords(records: SessionRecord[]) {
  persistStoredValue(SESSION_RECORDS_STORAGE_KEY, records);
}

function readStoredHooCollectionState(): HooCollectionState {
  if (Platform.OS !== 'web') {
    return createInitialHooCollectionState();
  }

  return parseStoredHooCollectionState(getBrowserStorage()?.getItem(HOO_COLLECTION_STORAGE_KEY) ?? null);
}

function persistHooCollectionState(state: HooCollectionState) {
  persistStoredValue(HOO_COLLECTION_STORAGE_KEY, state);
}

function readOrCreateGuestUserId() {
  if (Platform.OS !== 'web') {
    return createGuestUserId();
  }

  const storage = getBrowserStorage();
  let storedValue: string | null | undefined;

  try {
    storedValue = storage?.getItem(GUEST_USER_STORAGE_KEY);
  } catch {
    storedValue = null;
  }

  if (isGuestUserId(storedValue)) {
    return storedValue;
  }

  const nextUserId = createGuestUserId();

  try {
    storage?.setItem(GUEST_USER_STORAGE_KEY, nextUserId);
  } catch {
    // Guest identity can be regenerated if browser storage is unavailable.
  }

  return nextUserId;
}

function readStoredRoutineReminder(): RoutineReminder | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  return parseStoredRoutineReminder(getBrowserStorage()?.getItem(ROUTINE_REMINDER_STORAGE_KEY) ?? null);
}

function persistRoutineReminder(reminder: RoutineReminder) {
  persistStoredValue(ROUTINE_REMINDER_STORAGE_KEY, reminder);
}

function persistAuthState(authState: AuthState) {
  persistStoredValue(AUTH_STATE_STORAGE_KEY, authState);
}

function readStoredAuthState(guestUserId: string): AuthState {
  if (Platform.OS !== 'web') {
    return createGuestAuthState(guestUserId);
  }

  return parseStoredAuthState(getBrowserStorage()?.getItem(AUTH_STATE_STORAGE_KEY) ?? null)
    ?? createGuestAuthState(guestUserId);
}

async function scheduleRoutineNotification(reminder: RoutineReminder) {
  if (Platform.OS === 'web') {
    return { status: 'saved' as const };
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  const finalPermissions = currentPermissions.granted
    ? currentPermissions
    : await Notifications.requestPermissionsAsync();

  if (!finalPermissions.granted) {
    return { status: 'denied' as const };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('routine', {
      name: 'Routine reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (reminder.notification_id) {
    await Notifications.cancelScheduledNotificationAsync(reminder.notification_id);
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to breathe',
      body: 'Take a short pause with your daily routine.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminder.hour,
      minute: reminder.minute,
      channelId: Platform.OS === 'android' ? 'routine' : undefined,
    },
  });

  return { status: 'scheduled' as const, notificationId };
}

function formatDurationSummary(seconds: number) {
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatRecordTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function App() {
  const windowSize = useWindowDimensions();
  const layout = getHooResponsiveLayout({
    screenWidth: windowSize.width,
    screenHeight: windowSize.height,
  });
  const { width, height, isFramed } = layout;

  return (
    <HooApp
      width={width}
      height={height}
      isFramed={isFramed}
      screenHeight={windowSize.height}
    />
  );

  const [screen, setScreen] = useState<ScreenName>('onboarding');
  const [selectedSession, setSelectedSession] = useState<Session>(sessions[0]);
  const [selectedDestination, setSelectedDestination] = useState<Destination>(destinations[0]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(readStoredCheckIns);
  const [sessionRecords, setSessionRecords] = useState<SessionRecord[]>(readStoredSessionRecords);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => new Date());
  const [lastCompletedAt, setLastCompletedAt] = useState(() => new Date());
  const [guestUserId, setGuestUserId] = useState(readOrCreateGuestUserId);
  const [authState, setAuthState] = useState(() => readStoredAuthState(guestUserId));
  const [authAccessToken, setAuthAccessToken] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [routineReminder, setRoutineReminder] = useState<RoutineReminder | null>(readStoredRoutineReminder);
  const [routineNotice, setRoutineNotice] = useState<string | null>(null);
  const [routineDraft, setRoutineDraft] = useState<RoutineReminder | null>(null);
  const [routineReturnScreen, setRoutineReturnScreen] = useState<ScreenName>('arrival');
  const weekCheckIns = useMemo(() => getWeekCheckIns(checkIns), [checkIns]);
  const currentStreak = useMemo(() => getCurrentStreak(checkIns), [checkIns]);
  const weeklyRecordSummary = useMemo(() => getWeeklyRecordSummary(sessionRecords), [sessionRecords]);
  const sortedSessionRecords = useMemo(() => sortSessionRecordsNewestFirst(sessionRecords), [sessionRecords]);

  const selectedDestinationIndex = destinations.findIndex((destination) => destination.id === selectedDestination.id);
  const safeDestinationIndex = selectedDestinationIndex >= 0 ? selectedDestinationIndex : 0;

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let isMounted = true;

    async function restoreNativeStorage() {
      try {
        const [
          storedCheckIns,
          storedSessionRecords,
          storedRoutineReminder,
          storedGuestUserId,
          storedAuthState,
        ] = await Promise.all([
          AsyncStorage.getItem(CHECK_INS_STORAGE_KEY),
          AsyncStorage.getItem(SESSION_RECORDS_STORAGE_KEY),
          AsyncStorage.getItem(ROUTINE_REMINDER_STORAGE_KEY),
          AsyncStorage.getItem(GUEST_USER_STORAGE_KEY),
          AsyncStorage.getItem(AUTH_STATE_STORAGE_KEY),
        ]);

        if (!isMounted) {
          return;
        }

        const restoredGuestUserId = isGuestUserId(storedGuestUserId) ? storedGuestUserId : guestUserId;

        if (!isGuestUserId(storedGuestUserId)) {
          void AsyncStorage.setItem(GUEST_USER_STORAGE_KEY, restoredGuestUserId).catch(() => {});
        }

        setGuestUserId(restoredGuestUserId);
        setAuthState(parseStoredAuthState(storedAuthState) ?? createGuestAuthState(restoredGuestUserId));
        setCheckIns(parseStoredCheckIns(storedCheckIns));
        setSessionRecords(sortSessionRecordsNewestFirst(parseStoredSessionRecords(storedSessionRecords)));
        setRoutineReminder(parseStoredRoutineReminder(storedRoutineReminder));
      } catch {
        void AsyncStorage.setItem(GUEST_USER_STORAGE_KEY, guestUserId).catch(() => {});
      }
    }

    void restoreNativeStorage();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    persistAuthState(authState);
  }, [authState]);

  const completeSignIn = useCallback((nextAuthState: AuthState, accessToken?: string) => {
    setAuthState(nextAuthState);
    setAuthAccessToken(accessToken ?? null);
    setAuthNotice(null);

    if (nextAuthState.status !== 'signed-in') {
      return;
    }

    setSessionRecords((currentRecords) => {
      const preparedRecords = prepareSignedInSessionRecords(currentRecords, nextAuthState.user.user_id);

      if (preparedRecords.recordsToSync.length === 0) {
        return currentRecords;
      }

      persistSessionRecords(preparedRecords.records);
      void syncSessionRecordsToSupabase(
        preparedRecords.recordsToSync,
        { ...getSupabaseConfig(process.env), accessToken },
      ).catch(() => {});

      return preparedRecords.records;
    });
  }, []);

  const startAuthSetup = useCallback((provider: Exclude<AuthProvider, 'guest'>) => {
    const previewConnection = getPreviewAuthConnection(provider, process.env);

    if (previewConnection) {
      completeSignIn(previewConnection.authState, previewConnection.accessToken);
      return;
    }

    setAuthNotice(
      `${provider === 'apple' ? 'Apple' : 'Google'} sign-in needs developer credentials before it can be enabled.`,
    );
  }, [completeSignIn]);

  const handlePreviousDestination = () => {
    setSelectedDestination(destinations[(safeDestinationIndex - 1 + destinations.length) % destinations.length]);
  };

  const handleNextDestination = () => {
    setSelectedDestination(destinations[(safeDestinationIndex + 1) % destinations.length]);
  };

  const handleOnboardingContinue = () => {
    const session = sessions.find((item) => item.id === selectedDestination.sessionId) ?? sessions[0];
    setSelectedSession(session);
    setScreen('arrival');
  };

  const handleDestinationContinue = () => {
    const session = sessions.find((item) => item.id === selectedDestination.sessionId) ?? sessions[0];
    setSelectedSession(session);
    setScreen('prepare');
  };

  const startBreathingSession = useCallback(() => {
    setSessionStartedAt(new Date());
    setScreen('breathing');
  }, []);

  const handleSessionComplete = useCallback(() => {
    const completedAt = new Date();
    setLastCompletedAt(completedAt);
    const sessionRecord = createSessionRecord({
      session: selectedSession,
      userId: authState.user.user_id,
      startedAt: sessionStartedAt,
      completedAt,
    });

    setCheckIns((currentCheckIns) => {
      const nextCheckIns = markDailyCheckIn(currentCheckIns, completedAt);
      persistCheckIns(nextCheckIns);
      return nextCheckIns;
    });
    setSessionRecords((currentRecords) => {
      const nextRecords = sortSessionRecordsNewestFirst([...currentRecords, sessionRecord]);
      persistSessionRecords(nextRecords);
      return nextRecords;
    });
    void syncSessionRecordToSupabase(
      sessionRecord,
      getSupabaseConfig(process.env, authAccessToken ?? undefined),
    ).catch(() => {});
    setScreen('complete');
  }, [authAccessToken, authState.user.user_id, selectedSession, sessionStartedAt]);

  const handleSaveRoutine = useCallback(async (reminder: RoutineReminder) => {
    setRoutineNotice(null);

    try {
      const result = await scheduleRoutineNotification(reminder);

      if (result.status === 'denied') {
        setRoutineNotice('Notifications are off. You can enable them in settings anytime.');
        return;
      }

      const nextReminder = result.status === 'scheduled'
        ? { ...reminder, notification_id: result.notificationId }
        : reminder;

      persistRoutineReminder(nextReminder);
      setRoutineReminder(nextReminder);
      setRoutineNotice(`Daily reminder set for ${formatRoutineTime(nextReminder)}.`);
    } catch {
      setRoutineNotice('Could not save the reminder. Please try again.');
    }
  }, []);

  const openRoutineSetup = useCallback((returnScreen: ScreenName) => {
    setRoutineReturnScreen(returnScreen);
    setRoutineNotice(null);
    setRoutineDraft(routineReminder ?? createRoutineReminder(lastCompletedAt));
    setScreen('routine');
  }, [lastCompletedAt, routineReminder]);

  return (
    <View style={styles.root}>
      <View style={[styles.phoneFrame, { width, height }]}>
        <StatusBar style="dark" />
        {screen === 'onboarding' && (
          <OnboardingScreen
            width={width}
            height={height}
            destination={selectedDestination}
            onContinue={handleOnboardingContinue}
          />
        )}
        {screen === 'arrival' && (
          <ArrivalSessionScreen
            width={width}
            height={height}
            destination={selectedDestination}
            selectedSession={selectedSession}
            routineReminder={routineReminder}
            recordCount={sessionRecords.length}
            onSelectDestination={(destination) => {
              setSelectedDestination(destination);
              const session = sessions.find((item) => item.id === destination.sessionId) ?? sessions[0];
              setSelectedSession(session);
            }}
            onContinue={() => {
              const session = sessions.find((item) => item.id === selectedDestination.sessionId) ?? sessions[0];
              setSelectedSession(session);
              setScreen('prepare');
            }}
            onBack={() => setScreen('onboarding')}
            onOpenRoutine={() => openRoutineSetup('arrival')}
            onOpenRecords={() => setScreen('records')}
          />
        )}
        {screen === 'destination' && (
          <DestinationGlobeScreen
            width={width}
            height={height}
            destination={selectedDestination}
            onSelectDestination={setSelectedDestination}
            onContinue={handleDestinationContinue}
            onBack={() => setScreen('onboarding')}
          />
        )}
        {screen === 'select' && (
          <SessionMapScreen
            width={width}
            height={height}
            selectedSession={selectedSession}
            weekCheckIns={weekCheckIns}
            onSelectSession={setSelectedSession}
            onStart={() => setScreen('prepare')}
            onOpenRecords={() => setScreen('records')}
          />
        )}
        {screen === 'prepare' && (
          <PrepareScreen
            width={width}
            height={height}
            session={selectedSession}
            destination={selectedDestination}
            onBack={() => setScreen('arrival')}
            onStart={startBreathingSession}
          />
        )}
        {screen === 'breathing' && (
          <BreathingScreen
            width={width}
            height={height}
            session={selectedSession}
            onCancel={() => setScreen('arrival')}
            onComplete={handleSessionComplete}
          />
        )}
        {screen === 'complete' && (
          <CompleteScreen
            width={width}
            height={height}
            session={selectedSession}
            destination={selectedDestination}
            weekCheckIns={weekCheckIns}
            weeklyRecordSummary={weeklyRecordSummary}
            routineReminder={routineReminder}
            onRestart={startBreathingSession}
            onChooseAnother={() => setScreen('arrival')}
            onCreateRoutine={() => openRoutineSetup('complete')}
          />
        )}
        {screen === 'records' && (
          <RecordsScreen
            width={width}
            height={height}
            destination={selectedDestination}
            records={sortedSessionRecords}
            summary={weeklyRecordSummary}
            currentStreak={currentStreak}
            authState={authState}
            authNotice={authNotice}
            onStartAuth={startAuthSetup}
            onBack={() => setScreen('arrival')}
          />
        )}
        {screen === 'routine' && (
          <RoutineSetupScreen
            width={width}
            height={height}
            destination={selectedDestination}
            completedAt={lastCompletedAt}
            reminder={routineReminder}
            draftReminder={routineDraft}
            notice={routineNotice}
            onSave={handleSaveRoutine}
            onChangeDraft={setRoutineDraft}
            onBack={() => setScreen(routineReturnScreen)}
            onDone={() => setScreen(routineReturnScreen)}
          />
        )}
      </View>
    </View>
  );
}

const hooMoodOptions: Array<{
  id: HooMood;
  label: string;
  supportingLabel: string;
  left: number;
  top: number;
  size: number;
  characterSource: ImageSourcePropType;
  groupLeft: number;
  groupWidth: number;
  groupHeight: number;
  labelLeft: number;
  labelTop: number;
  labelWidth: number;
}> = [
  {
    id: 'busy',
    label: '머리가 복잡할 때',
    supportingLabel: '생각을 천천히 비우기',
    left: 42,
    top: 235,
    size: 150,
    characterSource: hooMoodCharacterSea,
    groupLeft: 22,
    groupWidth: 178,
    groupHeight: 210,
    labelLeft: 24,
    labelTop: 390,
    labelWidth: 174,
  },
  {
    id: 'rest',
    label: '잠깐 쉬고 싶을 때',
    supportingLabel: '가볍게 숨 고르기',
    left: 217,
    top: 235,
    size: 132,
    characterSource: hooMoodCharacterClover,
    groupLeft: 195,
    groupWidth: 174,
    groupHeight: 194,
    labelLeft: 197,
    labelTop: 374,
    labelWidth: 170,
  },
  {
    id: 'sleep',
    label: '자기 전',
    supportingLabel: '잠들 준비하기',
    left: 207,
    top: 485,
    size: 136,
    characterSource: hooMoodCharacterSleep,
    groupLeft: 194,
    groupWidth: 174,
    groupHeight: 205,
    labelLeft: 200,
    labelTop: 635,
    labelWidth: 162,
  },
  {
    id: 'tension',
    label: '긴장될 때',
    supportingLabel: '몸의 힘 풀기',
    left: 52,
    top: 485,
    size: 138,
    characterSource: hooMoodCharacterFlower,
    groupLeft: 26,
    groupWidth: 174,
    groupHeight: 205,
    labelLeft: 34,
    labelTop: 635,
    labelWidth: 158,
  },
];

function useHooMicrophoneLevel({
  active,
  onLevel,
  onNotice,
  onReady,
}: {
  active: boolean;
  onLevel: (level: number) => void;
  onNotice: (notice: string | null) => void;
  onReady?: () => void;
}) {
  useEffect(() => {
    let isMounted = true;
    let recording: Audio.Recording | null = null;

    async function startMetering() {
      if (Platform.OS === 'web') {
        return;
      }

      if (!active) {
        onLevel(0);
        return;
      }

      try {
        const permission = await Audio.requestPermissionsAsync();

        if (!permission.granted) {
          onNotice('마이크 권한을 허용하면 방울이 숨소리에 맞춰 떠올라요');
          onLevel(0);
          return;
        }

        onNotice(null);
        onReady?.();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const nextRecording = new Audio.Recording();
        nextRecording.setProgressUpdateInterval(160);
        nextRecording.setOnRecordingStatusUpdate((status) => {
          if (!isMounted || !status.isRecording) {
            return;
          }

          onLevel(normalizeHooMetering(status.metering));
        });
        await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.LOW_QUALITY);
        await nextRecording.startAsync();
        recording = nextRecording;
      } catch {
        onNotice('마이크를 사용할 수 없어 방울 효과를 잠시 멈췄어요');
        onLevel(0);
      }
    }

    void startMetering();

    return () => {
      isMounted = false;
      onLevel(0);
      if (recording) {
        void recording.stopAndUnloadAsync().catch(() => {});
      }
      void Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {});
    };
  }, [active, onLevel, onNotice, onReady]);
}

async function prepareHooBubbleSound({
  shouldPlay = false,
  volume = 1,
}: {
  shouldPlay?: boolean;
  volume?: number;
} = {}) {
  const { sound } = await Audio.Sound.createAsync(hooHydrophoneBubblesSound, {
    shouldPlay,
    volume,
  });

  return sound;
}

async function prepareHooBubbleSoundPool(soundPoolRef: MutableRefObject<Audio.Sound[]>) {
  if (soundPoolRef.current.length >= HOO_BUBBLE_SOUND_POOL_SIZE) {
    return;
  }

  try {
    const sounds = [...soundPoolRef.current];
    while (sounds.length < HOO_BUBBLE_SOUND_POOL_SIZE) {
      const sound = await prepareHooBubbleSound({ shouldPlay: false, volume: 0 });
      await sound.setPositionAsync(0);
      await sound.setVolumeAsync(1);
      sounds.push(sound);
    }

    soundPoolRef.current = sounds;
  } catch {
    const sounds = soundPoolRef.current;
    soundPoolRef.current = [];
    sounds.forEach((sound) => {
      void sound.unloadAsync().catch(() => {});
    });
  }
}

async function playHooHydrophoneBubbles(
  soundPoolRef: MutableRefObject<Audio.Sound[]>,
  soundPoolIndexRef: MutableRefObject<number>,
  volume: number,
) {
  try {
    if (soundPoolRef.current.length <= 0) {
      await prepareHooBubbleSoundPool(soundPoolRef);
    }

    let sound = soundPoolRef.current[soundPoolIndexRef.current % soundPoolRef.current.length];
    if (!sound) {
      sound = await prepareHooBubbleSound();
      soundPoolRef.current = [sound];
      soundPoolIndexRef.current = 0;
    }

    soundPoolIndexRef.current += 1;
    await sound.setVolumeAsync(Math.max(0.9, Math.min(1, volume)));
    await sound.setPositionAsync(0);
    await sound.replayAsync();
  } catch {
    const sounds = soundPoolRef.current;
    soundPoolRef.current = [];
    soundPoolIndexRef.current = 0;
    sounds.forEach((sound) => {
      void sound.unloadAsync().catch(() => {});
    });
    // Bubble audio is decorative; breathing should continue if playback is blocked.
  }
}

function stopHooBubbleSounds(soundPoolRef: MutableRefObject<Audio.Sound[]>) {
  soundPoolRef.current.forEach((sound) => {
    void sound.stopAsync()
      .catch(() => sound.pauseAsync())
      .catch(() => {})
      .finally(() => {
        void sound.setPositionAsync(0).catch(() => {});
      });
  });
}

async function playHooCountdownDrops() {
  try {
    const { sound } = await Audio.Sound.createAsync(hooCountdownDropsSound, {
      shouldPlay: true,
      volume: 0.62,
    });

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        void sound.unloadAsync().catch(() => {});
      }
    });
    setTimeout(() => {
      void sound.unloadAsync().catch(() => {});
    }, 4300);
  } catch {
    // Countdown audio is decorative; the visual timer remains authoritative.
  }
}

async function prepareHooWaterAmbienceSound({
  shouldPlay = false,
  volume = 0.16,
}: {
  shouldPlay?: boolean;
  volume?: number;
} = {}) {
  const { sound } = await Audio.Sound.createAsync(hooWaterAmbienceSound, {
    shouldPlay,
    isLooping: true,
    volume,
  });

  return sound;
}

async function prepareHooCompletionAchievementSound({
  shouldPlay = false,
  volume = 0.92,
}: {
  shouldPlay?: boolean;
  volume?: number;
} = {}) {
  const { sound } = await Audio.Sound.createAsync(hooCompletionAchievementSound, {
    shouldPlay,
    volume,
  });

  return sound;
}

async function playPreparedHooCompletionAchievement(soundRef: MutableRefObject<Audio.Sound | null>) {
  try {
    let sound = soundRef.current;
    if (!sound) {
      sound = await prepareHooCompletionAchievementSound();
      soundRef.current = sound;
    }

    await sound.setVolumeAsync(0.92);
    await sound.setPositionAsync(0);
    await sound.replayAsync();
  } catch {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      void sound.unloadAsync().catch(() => {});
    }
    // Completion audio is decorative; the captured character should still appear.
  }
}

type HooTactilePressableProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children?: ReactNode;
  feedbackStyle?: StyleProp<ViewStyle>;
  pressOverlayStyle?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

function HooTactilePressable({
  children,
  feedbackStyle,
  onPressIn,
  onPressOut,
  pressOverlayStyle,
  pressedScale = 0.965,
  ...props
}: HooTactilePressableProps) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const pressOverlayOpacity = useRef(new Animated.Value(0)).current;

  const animatePressFeedback = useCallback((scaleToValue: number, opacityToValue: number, duration: number) => {
    Animated.parallel([
      Animated.timing(pressScale, {
        toValue: scaleToValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pressOverlayOpacity, {
        toValue: opacityToValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [pressOverlayOpacity, pressScale]);

  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        animatePressFeedback(pressedScale, 1, HOO_TACTILE_PRESS_IN_MS);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animatePressFeedback(1, 0, HOO_TACTILE_PRESS_OUT_MS);
        onPressOut?.(event);
      }}
    >
      <Animated.View style={[hooStyles.tactilePressFeedback, feedbackStyle, { transform: [{ scale: pressScale }] }]}>
        {children}
        {pressOverlayStyle && (
          <Animated.View
            pointerEvents="none"
            style={[hooStyles.tactilePressOverlay, pressOverlayStyle, { opacity: pressOverlayOpacity }]}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

function HooIdleFloat({
  amplitudeX = 1.2,
  amplitudeY = 10,
  children,
  delayMs = 0,
  durationMs = 5600,
  style,
}: {
  amplitudeX?: number;
  amplitudeY?: number;
  children: ReactNode;
  delayMs?: number;
  durationMs?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const floatProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    floatProgress.setValue(0);
    let floatLoop: Animated.CompositeAnimation | null = null;
    const delayHandle = setTimeout(() => {
      floatLoop = Animated.loop(
        Animated.timing(floatProgress, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      floatLoop.start();
    }, delayMs);

    return () => {
      clearTimeout(delayHandle);
      floatLoop?.stop();
    };
  }, [delayMs, durationMs, floatProgress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          transform: [
            {
              translateX: floatProgress.interpolate({
                inputRange: [0, 0.16, 0.34, 0.5, 0.66, 0.84, 1],
                outputRange: [
                  0,
                  amplitudeX * 0.06,
                  amplitudeX * 0.12,
                  0,
                  amplitudeX * -0.08,
                  amplitudeX * -0.04,
                  0,
                ],
              }),
            },
            {
              translateY: floatProgress.interpolate({
                inputRange: [0, 0.16, 0.34, 0.5, 0.66, 0.84, 1],
                outputRange: [
                  0,
                  amplitudeY * -0.18,
                  amplitudeY * -0.44,
                  amplitudeY * -0.72,
                  amplitudeY * -0.44,
                  amplitudeY * -0.18,
                  0,
                ],
              }),
            },
            {
              scale: floatProgress.interpolate({
                inputRange: [0, 0.16, 0.34, 0.5, 0.66, 0.84, 1],
                outputRange: [1, 1.004, 1.01, 1.016, 1.01, 1.004, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function HooApp({
  width,
  height,
  isFramed,
  screenHeight,
}: {
  width: number;
  height: number;
  isFramed: boolean;
  screenHeight: number;
}) {
  const [flowState, setFlowState] = useState(createInitialHooFlowState);
  const [prepareCountdown, setPrepareCountdown] = useState<number>(HOO_INITIAL_PREPARE_COUNTDOWN);
  const [phaseRemainingSeconds, setPhaseRemainingSeconds] = useState<number | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [firstExhaleGuideElapsedMs, setFirstExhaleGuideElapsedMs] = useState(0);
  const [hasDetectedFirstExhale, setHasDetectedFirstExhale] = useState(false);
  const [floatingBubbles, setFloatingBubbles] = useState<HooBubble[]>([]);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [isMicReady, setIsMicReady] = useState(false);
  const [isRequestingMicPermission, setIsRequestingMicPermission] = useState(false);
  const [hasOpenedMicGate, setHasOpenedMicGate] = useState(false);
  // 안내 팝업은 세션을 시작할 때마다 보여준다(영구 저장 X). 시작 시 false로 리셋.
  const [guideAcknowledged, setGuideAcknowledged] = useState(false);
  const [isFinalCharacterCaptured, setIsFinalCharacterCaptured] = useState(false);
  const [collectionState, setCollectionState] = useState(readStoredHooCollectionState);
  const [selectedHooCollectionCharacter, setSelectedHooCollectionCharacter] = useState<HooCollectionCharacter>(
    () => chooseRandomHooCollectionSessionCharacter(readStoredHooCollectionState()),
  );
  const [collectionCategory, setCollectionCategory] = useState<HooCollectionCategory>('all');
  const [lastCollectionCapture, setLastCollectionCapture] = useState<{
    character: HooCollectionCharacter;
    isNewCapture: boolean;
  } | null>(null);
  const [isCollectionCaptureSheetVisible, setIsCollectionCaptureSheetVisible] = useState(false);
  const volumeLevelRef = useRef(0);
  const bubbleSoundPoolRef = useRef<Audio.Sound[]>([]);
  const bubbleSoundPoolIndexRef = useRef(0);
  const completionAchievementSoundRef = useRef<Audio.Sound | null>(null);
  const sessionAmbienceRef = useRef<Audio.Sound | null>(null);
  const exhaleBubbleStateRef = useRef({ nextSeed: 0, lastBurstAtMs: 0 });
  const finalCaptureAccumMsRef = useRef(0);
  const finalCaptureTickRef = useRef<number | null>(null);
  const hasRecordedCollectionCaptureRef = useRef(false);
  const hasPlayedCompletionAchievementForSessionRef = useRef(false);
  const selectionCommitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectionCaptureSheetDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDetectedExhaleAtRef = useRef(0);
  const heldExhaleVolumeRef = useRef(0);
  const webMicStreamRef = useRef<MediaStream | null>(null);
  const webAudioContextRef = useRef<AudioContext | null>(null);
  const webMicSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const webMicTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFirstExhaleBubbleDetectedRef = useRef<(() => void) | null>(null);
  const currentCopy = getHooPhaseCopy(flowState.breathPhase);
  const shouldMeterMic = isMicReady && flowState.screen === 'breathing';
  const shouldListenToMic = flowState.screen === 'breathing' && flowState.breathPhase === 'exhale';
  const shouldGuideFirstExhale = shouldListenToMic && flowState.breathIndex === 1;
  const isFinalBreath = flowState.screen === 'breathing' && isHooFinalBreath(flowState.breathIndex);
  const isFinalInhale = isFinalBreath && flowState.breathPhase === 'inhale';
  const isFinalExhale = isFinalBreath && flowState.breathPhase === 'exhale';
  const isFinalCaptureBreath = shouldListenToMic && isFinalExhale;
  const canAutoAdvanceBreathingPhase = !isFinalExhale || isFinalCharacterCaptured;
  const collectionSummary = getHooCollectionSummary(collectionState);
  const firstExhaleGuideActions = useMemo(() => ({
    onFirstExhaleBubbleDetected: () => setHasDetectedFirstExhale(true),
  }), []);
  const firstExhaleGuideCopy = getHooFirstExhaleGuideCopy({
    screen: flowState.screen,
    breathIndex: flowState.breathIndex,
    breathPhase: flowState.breathPhase,
    elapsedMs: firstExhaleGuideElapsedMs,
    hasDetectedBreath: hasDetectedFirstExhale,
  });

  // Looping water ambience — separate from the on-exhale bubble pop sound.
  // Starts when breathing begins (after the 3-2-1 countdown, NOT during prepare)
  // and keeps playing through complete/failed until the user leaves the session.
  const isHooSessionActive =
    flowState.screen === 'breathing'
    || flowState.screen === 'complete'
    || flowState.screen === 'failed';

  function clearCollectionCaptureSheetDelay() {
    if (collectionCaptureSheetDelayRef.current) {
      clearTimeout(collectionCaptureSheetDelayRef.current);
      collectionCaptureSheetDelayRef.current = null;
    }
  }

  function resetHooBreathFeedbackState() {
    volumeLevelRef.current = 0;
    setVolumeLevel(0);
    setFloatingBubbles([]);
    exhaleBubbleStateRef.current = { nextSeed: 0, lastBurstAtMs: 0 };
    lastDetectedExhaleAtRef.current = 0;
    heldExhaleVolumeRef.current = 0;
    finalCaptureAccumMsRef.current = 0;
    finalCaptureTickRef.current = null;
    setIsFinalCharacterCaptured(false);
  }

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let isMounted = true;

    async function restoreNativeHooCollection() {
      try {
        const storedCollection = await AsyncStorage.getItem(HOO_COLLECTION_STORAGE_KEY);
        if (isMounted) {
          setCollectionState(parseStoredHooCollectionState(storedCollection));
        }
      } catch {
        // Collection progress is local best-effort state for the prototype.
      }
    }

    void restoreNativeHooCollection();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHooSessionActive) {
      return;
    }

    let isActive = true;
    let gestureCleanup: (() => void) | null = null;

    async function ensurePlaying(sound: Audio.Sound) {
      try {
        const status = await sound.playAsync();
        if (status.isLoaded && status.isPlaying) {
          return true;
        }
      } catch {
        // Browsers may block playback that starts outside a user gesture.
      }
      return false;
    }

    async function startAmbience() {
      try {
        let sound = sessionAmbienceRef.current;
        if (!sound) {
          sound = await prepareHooWaterAmbienceSound();
          sessionAmbienceRef.current = sound;
        }

        if (!isActive) {
          void sound.unloadAsync().catch(() => {});
          return;
        }

        await sound.setVolumeAsync(0.16);
        const playing = await ensurePlaying(sound);

        // If the first play attempt was blocked by autoplay policy, retry on the
        // next tap/keypress so the ambience still comes in once the user acts.
        if (!playing && Platform.OS === 'web' && typeof window !== 'undefined') {
          const retry = () => {
            void ensurePlaying(sound);
            gestureCleanup?.();
          };
          window.addEventListener('pointerdown', retry, { once: true });
          window.addEventListener('keydown', retry, { once: true });
          gestureCleanup = () => {
            window.removeEventListener('pointerdown', retry);
            window.removeEventListener('keydown', retry);
            gestureCleanup = null;
          };
        }
      } catch {
        // Ambience is decorative; the session continues if playback is blocked.
      }
    }

    void startAmbience();

    return () => {
      isActive = false;
      gestureCleanup?.();
      const sound = sessionAmbienceRef.current;
      sessionAmbienceRef.current = null;
      if (sound) {
        void sound.unloadAsync().catch(() => {});
      }
    };
  }, [isHooSessionActive]);
  const hooBubbleContextRef = useRef({
    shouldListenToMic,
    breathPhase: flowState.breathPhase,
    breathIndex: flowState.breathIndex,
  });
  const markMicReady = useCallback(() => {
    setIsMicReady(true);
    setMicNotice(null);
  }, []);

  useEffect(() => {
    hooBubbleContextRef.current = {
      shouldListenToMic,
      breathPhase: flowState.breathPhase,
      breathIndex: flowState.breathIndex,
    };
  }, [flowState.breathIndex, flowState.breathPhase, shouldListenToMic]);

  const stopWebMicMetering = useCallback((shouldStopStream: boolean) => {
    if (webMicTimerRef.current) {
      clearTimeout(webMicTimerRef.current);
      webMicTimerRef.current = null;
    }

    webMicSourceRef.current?.disconnect();
    webMicSourceRef.current = null;
    void webAudioContextRef.current?.close().catch(() => {});
    webAudioContextRef.current = null;

    if (shouldStopStream) {
      webMicStreamRef.current?.getTracks().forEach((track) => track.stop());
      webMicStreamRef.current = null;
    }
  }, []);

  const emitHooBubblesFromVolume = useCallback((nextVolumeLevel: number) => {
    const bubbleContext = hooBubbleContextRef.current;
    const burst = createHooExhaleBubbleBurst({
      isExhaleActive: bubbleContext.shouldListenToMic,
      volumeLevel: nextVolumeLevel,
      breathIndex: bubbleContext.breathIndex,
      nowMs: Date.now(),
      lastBurstAtMs: exhaleBubbleStateRef.current.lastBurstAtMs,
      nextSeed: exhaleBubbleStateRef.current.nextSeed,
    });

    exhaleBubbleStateRef.current = {
      nextSeed: burst.nextSeed,
      lastBurstAtMs: burst.nextLastBurstAtMs,
    };

    if (burst.bubbles.length <= 0) {
      return;
    }

    if (bubbleContext.breathIndex === 1) {
      onFirstExhaleBubbleDetectedRef.current?.();
    }

    setFloatingBubbles((currentBubbles) => [...currentBubbles.slice(-28), ...burst.bubbles]);
    void playHooHydrophoneBubbles(bubbleSoundPoolRef, bubbleSoundPoolIndexRef, burst.soundVolume);

    // 딜레이 + 상승 + 팝(150ms)까지 모두 끝난 뒤 제거 (늦게 뜨는 방울이 잘리지 않게).
    const clearDelay = Math.max(...burst.bubbles.map((bubble) => bubble.delayMs + bubble.durationMs)) + 420;
    setTimeout(() => {
      const bubbleIds = new Set(burst.bubbles.map((bubble) => bubble.id));
      setFloatingBubbles((currentBubbles) => currentBubbles.filter((bubble) => !bubbleIds.has(bubble.id)));
    }, clearDelay);
  }, []);

  const handleHooMicLevel = useCallback((nextVolumeLevel: number) => {
    volumeLevelRef.current = nextVolumeLevel;
    setVolumeLevel(nextVolumeLevel);
    if (shouldGuideFirstExhale && nextVolumeLevel >= HOO_FIRST_EXHALE_DETECTION_THRESHOLD) {
      setHasDetectedFirstExhale(true);
    }
    if (hooBubbleContextRef.current.shouldListenToMic && nextVolumeLevel >= HOO_EXHALE_DETECTION_VOLUME_THRESHOLD) {
      lastDetectedExhaleAtRef.current = Date.now();
      heldExhaleVolumeRef.current = nextVolumeLevel;
    }
  }, [emitHooBubblesFromVolume, shouldGuideFirstExhale]);

  useHooMicrophoneLevel({
    active: shouldMeterMic,
    onLevel: handleHooMicLevel,
    onNotice: setMicNotice,
    onReady: markMicReady,
  });

  const startWebMicMetering = useCallback(async (stream: MediaStream): Promise<boolean> => {
    const AudioContextConstructor =
      (globalThis as typeof globalThis & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) {
      return false;
    }

    stopWebMicMetering(false);

    try {
      const audioContext = new AudioContextConstructor();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.42;
      const samples = new Float32Array(analyser.fftSize);
      source.connect(analyser);
      webAudioContextRef.current = audioContext;
      webMicSourceRef.current = source;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const updateWebMicLevel = () => {
        analyser.getFloatTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
          sum += sample * sample;
        }

        handleHooMicLevel(normalizeHooWebAmplitude(Math.sqrt(sum / samples.length)));
        webMicTimerRef.current = setTimeout(updateWebMicLevel, 80);
      };

      updateWebMicLevel();
      return true;
    } catch {
      stopWebMicMetering(false);
      return false;
    }
  }, [handleHooMicLevel, stopWebMicMetering]);

  const prepareHooBubbleSoundFromPress = useCallback(async () => {
    if (bubbleSoundPoolRef.current.length >= HOO_BUBBLE_SOUND_POOL_SIZE) {
      return;
    }

    await prepareHooBubbleSoundPool(bubbleSoundPoolRef);
  }, []);

  const prepareHooWaterAmbienceSoundFromPress = useCallback(async () => {
    if (sessionAmbienceRef.current) {
      return;
    }

    try {
      const sound = await prepareHooWaterAmbienceSound({ shouldPlay: false, volume: 0 });
      sessionAmbienceRef.current = sound;
    } catch {
      const sound = sessionAmbienceRef.current;
      sessionAmbienceRef.current = null;
      if (sound) {
        void sound.unloadAsync().catch(() => {});
      }
    }
  }, []);

  const requestMicPermissionFromPress = useCallback(async (): Promise<boolean> => {
    setIsRequestingMicPermission(true);
    void prepareHooBubbleSoundFromPress();
    void prepareHooWaterAmbienceSoundFromPress();

    try {
      if (Platform.OS === 'web') {
        const existingStream = webMicStreamRef.current;
        if (existingStream?.getAudioTracks().some((track) => track.readyState === 'live')) {
          const didStartMetering = await startWebMicMetering(existingStream);
          setIsMicReady(didStartMetering);
          setHasOpenedMicGate(didStartMetering);
          setMicNotice(didStartMetering ? null : '마이크 입력을 읽지 못했어요');
          return didStartMetering;
        }

        const stream = await globalThis.navigator?.mediaDevices?.getUserMedia?.({
          audio: {
            // 호흡/바람소리는 비음성 신호라 브라우저 오디오 처리(에코제거·노이즈제거·자동게인)에
            // 의해 깎여나가 방울이 안 뜨는 원인이 된다. 날숨을 그대로 잡으려면 raw로 받는다.
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        if (!stream) {
          setMicNotice('브라우저에서 마이크를 사용할 수 없어요');
          setIsMicReady(false);
          setHasOpenedMicGate(false);
          return false;
        }

        webMicStreamRef.current?.getTracks().forEach((track) => track.stop());
        webMicStreamRef.current = stream;
        const didStartMetering = await startWebMicMetering(stream);
        setIsMicReady(didStartMetering);
        setHasOpenedMicGate(didStartMetering);
        setMicNotice(didStartMetering ? null : '마이크 입력을 읽지 못했어요');
        return didStartMetering;
      }

      const permission = await Audio.requestPermissionsAsync();
      setIsMicReady(permission.granted);
      setHasOpenedMicGate(permission.granted);
      setMicNotice(permission.granted ? null : '마이크 권한을 허용해주세요');
      return permission.granted;
    } catch {
      setIsMicReady(false);
      setHasOpenedMicGate(false);
      setMicNotice('브라우저 설정에서 마이크를 허용해주세요');
      return false;
    } finally {
      setIsRequestingMicPermission(false);
    }
  }, [prepareHooBubbleSoundFromPress, prepareHooWaterAmbienceSoundFromPress, startWebMicMetering]);

  useEffect(
    () => () => {
      stopWebMicMetering(true);
      const bubbleSounds = bubbleSoundPoolRef.current;
      bubbleSoundPoolRef.current = [];
      bubbleSoundPoolIndexRef.current = 0;
      bubbleSounds.forEach((sound) => {
        void sound.unloadAsync().catch(() => {});
      });
      const completionSound = completionAchievementSoundRef.current;
      completionAchievementSoundRef.current = null;
      if (completionSound) {
        void completionSound.unloadAsync().catch(() => {});
      }
      const ambienceSound = sessionAmbienceRef.current;
      sessionAmbienceRef.current = null;
      if (ambienceSound) {
        void ambienceSound.unloadAsync().catch(() => {});
      }
    },
    [stopWebMicMetering],
  );

  useEffect(() => {
    if (flowState.screen !== 'prepare' || !hasOpenedMicGate) {
      setPrepareCountdown(HOO_INITIAL_PREPARE_COUNTDOWN);
      return;
    }

    setPrepareCountdown(HOO_INITIAL_PREPARE_COUNTDOWN);
    void playHooCountdownDrops();

    const prepareCountdownTimers = [
      setTimeout(() => setPrepareCountdown(2), HOO_PREPARE_STEP_MS),
      setTimeout(() => setPrepareCountdown(1), HOO_PREPARE_STEP_MS * 2),
      setTimeout(() => {
        setFlowState((currentState) => startHooBreathing(currentState));
        setPrepareCountdown(HOO_INITIAL_PREPARE_COUNTDOWN);
      }, HOO_PREPARE_STEP_MS * 3),
    ];

    return () => {
      prepareCountdownTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [flowState.screen, flowState.selectedMood, hasOpenedMicGate]);

  useEffect(() => {
    if (flowState.screen !== 'breathing') {
      setPhaseRemainingSeconds(null);
      return;
    }

    const countdownValues = createHooPhaseCountdownValues(flowState.breathPhase);
    let countdownIndex = 0;

    setPhaseRemainingSeconds(countdownValues[0] ?? null);
    const interval = setInterval(() => {
      countdownIndex += 1;
      setPhaseRemainingSeconds(countdownValues[countdownIndex] ?? 1);

      if (countdownIndex >= countdownValues.length - 1) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [flowState.breathIndex, flowState.breathPhase, flowState.screen]);

  useEffect(() => {
    onFirstExhaleBubbleDetectedRef.current = shouldGuideFirstExhale
      ? firstExhaleGuideActions.onFirstExhaleBubbleDetected
      : null;

    if (!shouldGuideFirstExhale) {
      setFirstExhaleGuideElapsedMs(0);
      setHasDetectedFirstExhale(false);
      return;
    }

    setFirstExhaleGuideElapsedMs(0);
    setHasDetectedFirstExhale(false);
    const interval = setInterval(() => {
      setFirstExhaleGuideElapsedMs((elapsedMs) => elapsedMs + 100);
    }, 100);

    return () => clearInterval(interval);
  }, [firstExhaleGuideActions.onFirstExhaleBubbleDetected, shouldGuideFirstExhale]);

  useEffect(() => {
    if (flowState.screen !== 'breathing' || !canAutoAdvanceBreathingPhase) {
      return;
    }

    const advanceDelay = isFinalExhale && isFinalCharacterCaptured
      ? 1300
      : getHooPhaseAdvanceDelayMs(flowState.breathPhase);

    const timeout = setTimeout(() => {
      setFlowState((currentState) => progressHooFlow(currentState));
    }, advanceDelay);

    return () => clearTimeout(timeout);
  }, [
    canAutoAdvanceBreathingPhase,
    flowState.breathIndex,
    flowState.breathPhase,
    flowState.screen,
    isFinalCharacterCaptured,
    isFinalExhale,
  ]);

  useEffect(() => {
    if (!isFinalCaptureBreath) {
      finalCaptureAccumMsRef.current = 0;
      finalCaptureTickRef.current = null;
      setIsFinalCharacterCaptured(false);
      return;
    }

    if (isFinalCharacterCaptured) {
      return;
    }

    // "적당히 불면 성공" — 끊김 없이 연속이 아니라, 분 시간을 누적한다.
    // 중간에 약해져도 0으로 리셋하지 않고, 임계값 넘는 동안만 시간을 더해
    // 누적 HOO_FINAL_CAPTURE_BLOW_MS에 도달하면 캐릭터 포획(성공).
    finalCaptureAccumMsRef.current = 0;
    finalCaptureTickRef.current = null;
    const interval = setInterval(() => {
      const now = Date.now();
      const last = finalCaptureTickRef.current;
      finalCaptureTickRef.current = now;

      if (volumeLevelRef.current >= HOO_BLOW_VOLUME_THRESHOLD) {
        // 첫 틱이거나 큰 간격은 한 틱치(≤200ms)로 제한해 튐 방지.
        const delta = last === null ? 0 : Math.min(now - last, 200);
        finalCaptureAccumMsRef.current += delta;
        if (finalCaptureAccumMsRef.current >= HOO_FINAL_CAPTURE_BLOW_MS) {
          setIsFinalCharacterCaptured(true);
        }
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isFinalCaptureBreath, isFinalCharacterCaptured]);

  useEffect(() => {
    const shouldFailFinalCapture = isFinalCaptureBreath && !isFinalCharacterCaptured;
    if (!shouldFailFinalCapture) {
      return;
    }

    const timeout = setTimeout(() => {
      setFlowState((currentState) => failHooFinalCapture(currentState));
    }, getHooPhaseAdvanceDelayMs(flowState.breathPhase));

    return () => clearTimeout(timeout);
  }, [
    flowState.breathPhase,
    isFinalCaptureBreath,
    isFinalCharacterCaptured,
  ]);

  useEffect(() => {
    if (!shouldListenToMic) {
      stopHooBubbleSounds(bubbleSoundPoolRef);
      setVolumeLevel(0);
      lastDetectedExhaleAtRef.current = 0;
      heldExhaleVolumeRef.current = 0;
      exhaleBubbleStateRef.current = {
        ...exhaleBubbleStateRef.current,
        lastBurstAtMs: 0,
      };
      return;
    }

    // 마이크 샘플이 잠깐 비는 순간만, 실제 숨 감지 직후의 볼륨을 아주 짧게 유지한다.
    const interval = setInterval(() => {
      const canUseHeldExhaleVolume = Date.now() - lastDetectedExhaleAtRef.current <= HOO_EXHALE_VOLUME_HOLD_MS;
      emitHooBubblesFromVolume(canUseHeldExhaleVolume ? heldExhaleVolumeRef.current : volumeLevelRef.current);
    }, HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      stopHooBubbleSounds(bubbleSoundPoolRef);
    };
  }, [emitHooBubblesFromVolume, shouldListenToMic]);

  useEffect(
    () => () => {
      if (selectionCommitTimeoutRef.current) {
        clearTimeout(selectionCommitTimeoutRef.current);
      }
      clearCollectionCaptureSheetDelay();
    },
    [],
  );

  const commitAfterTactilePress = useCallback((commit: () => void | Promise<void>) => {
    if (selectionCommitTimeoutRef.current) {
      clearTimeout(selectionCommitTimeoutRef.current);
    }

    selectionCommitTimeoutRef.current = setTimeout(() => {
      selectionCommitTimeoutRef.current = null;
      void commit();
    }, HOO_SELECTION_COMMIT_DELAY_MS);
  }, []);

  const backToOnboarding = useCallback(() => {
    clearCollectionCaptureSheetDelay();
    setIsCollectionCaptureSheetVisible(false);
    setFlowState((currentState) => ({
      ...currentState,
      screen: 'onboarding',
      selectedMood: null,
      breathIndex: 1,
      breathPhase: 'inhale',
    }));
  }, []);

  const beginSession = useCallback(() => {
    // 세션을 시작할 때마다 안내 팝업을 다시 보여준다.
    clearCollectionCaptureSheetDelay();
    resetHooBreathFeedbackState();
    setSelectedHooCollectionCharacter(chooseRandomHooCollectionSessionCharacter(collectionState));
    setGuideAcknowledged(false);
    setIsCollectionCaptureSheetVisible(false);
    hasRecordedCollectionCaptureRef.current = false;
    hasPlayedCompletionAchievementForSessionRef.current = false;
    setFlowState((currentState) => beginHooSession(currentState));
  }, [collectionState]);

  const beginSessionFromPress = () => {
    commitAfterTactilePress(beginSession);
  };

  // 가이드 팝업 "시작하기" — 이번 세션 안내 닫음 + 마이크 권한 요청(직접 탭이라 안정적).
  const acknowledgeGuide = useCallback(() => {
    setGuideAcknowledged(true);
    void requestMicPermissionFromPress();
  }, [requestMicPermissionFromPress]);

  const restartSession = () => {
    commitAfterTactilePress(() => {
      clearCollectionCaptureSheetDelay();
      resetHooBreathFeedbackState();
      setSelectedHooCollectionCharacter(chooseRandomHooCollectionSessionCharacter(collectionState));
      setIsCollectionCaptureSheetVisible(false);
      hasRecordedCollectionCaptureRef.current = false;
      hasPlayedCompletionAchievementForSessionRef.current = false;
      setFlowState((currentState) => restartHooBreathing(currentState));
    });
  };

  const resetSession = () => {
    commitAfterTactilePress(() => {
      clearCollectionCaptureSheetDelay();
      resetHooBreathFeedbackState();
      setSelectedHooCollectionCharacter(chooseRandomHooCollectionSessionCharacter(collectionState));
      setIsCollectionCaptureSheetVisible(false);
      hasRecordedCollectionCaptureRef.current = false;
      hasPlayedCompletionAchievementForSessionRef.current = false;
      setFlowState(createInitialHooFlowState());
    });
  };

  const openHooCollection = useCallback(() => {
    clearCollectionCaptureSheetDelay();
    setIsCollectionCaptureSheetVisible(false);
    setFlowState((currentState) => ({
      ...currentState,
      screen: 'collection',
    }));
  }, []);

  const dismissCollectionCaptureSheet = useCallback(() => {
    clearCollectionCaptureSheetDelay();
    setIsCollectionCaptureSheetVisible(false);
  }, []);

  useEffect(() => {
    if (flowState.screen !== 'complete' || hasPlayedCompletionAchievementForSessionRef.current) {
      return;
    }

    hasPlayedCompletionAchievementForSessionRef.current = true;
    void playPreparedHooCompletionAchievement(completionAchievementSoundRef);
  }, [flowState.screen]);

  useEffect(() => {
    if (flowState.screen !== 'complete' || hasRecordedCollectionCaptureRef.current) {
      return;
    }

    hasRecordedCollectionCaptureRef.current = true;
    clearCollectionCaptureSheetDelay();
    setIsCollectionCaptureSheetVisible(false);
    setCollectionState((currentCollectionState) => {
      const captureResult = recordHooCollectionCapture(currentCollectionState, new Date(), selectedHooCollectionCharacter);

      persistHooCollectionState(captureResult.state);
      setLastCollectionCapture({
        character: captureResult.capturedCharacter,
        isNewCapture: captureResult.isNewCapture,
      });
      collectionCaptureSheetDelayRef.current = setTimeout(() => {
        collectionCaptureSheetDelayRef.current = null;
        setIsCollectionCaptureSheetVisible(true);
      }, HOO_COLLECTION_CAPTURE_SHEET_DELAY_MS);

      return captureResult.state;
    });

    return () => clearCollectionCaptureSheetDelay();
  }, [flowState.screen, selectedHooCollectionCharacter]);

  const isHooSessionScreen =
    flowState.screen === 'prepare'
    || flowState.screen === 'breathing'
    || flowState.screen === 'complete'
    || flowState.screen === 'failed';
  // 가이드 팝업이 떠 있는 동안엔 마이크 안내를 띄우지 않는다.
  const isGuideOpen = flowState.screen === 'prepare' && !guideAcknowledged;
  // 마이크 권한 안내는 "아직 게이트도 안 열었고 + 마이크도 준비 안 됨"일 때만.
  // 한 번 허용해 isMicReady가 true가 되면 다시하기 후에도 안내가 번쩍이지 않는다.
  const isMicPermissionRequestPending =
    flowState.screen === 'prepare' && isRequestingMicPermission;
  const needsMicPermission =
    flowState.screen === 'prepare' && !isGuideOpen && !isRequestingMicPermission && !hasOpenedMicGate && !isMicReady;
  const visibleSessionHeight = isFramed ? height : screenHeight;
  const completionResponsiveLayout = {
    width,
    height,
    isFramed: false,
    screenWidth: width,
    screenHeight: visibleSessionHeight,
    shortScreenRatio: getHooResponsiveLayout({ screenWidth: width, screenHeight: visibleSessionHeight }).shortScreenRatio,
  };
  const completionButtonLayout = getHooCompletionButtonLayout({
    layout: completionResponsiveLayout,
    bubbleSize: s(257, width),
    characterSize: s(232, width),
    buttonWidth: x(335, width),
    buttonHeight: y(56, height),
  });
  const shouldUseStaticSessionBackground = flowState.screen === 'complete';

  return (
    <View style={[hooStyles.root, { overflow: 'hidden' }]}>
      {/* 데스크톱 프레임 밖은 단순 배경만 두고, 세션 영상은 휴대폰 화면 안에서만 렌더링한다. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#A4D6EF', '#BFE6F3', '#D6EFF6']} style={StyleSheet.absoluteFill} />
        {!shouldUseStaticSessionBackground && !isFramed && isHooSessionScreen && (
          <Video
            source={hooSessionBackgroundVideo}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            usePoster
            posterSource={hooSessionBackgroundPoster}
            posterStyle={StyleSheet.absoluteFill}
          />
        )}
      </View>
      <StatusBar style="light" />
      <View
        style={[
          isFramed ? hooStyles.appFrameLayer : hooStyles.appLayer,
          isFramed ? { width, height } : null,
        ]}
      >
        {flowState.screen === 'onboarding' && (
          <HooScreenFade>
            <HooTactilePressable
              accessibilityRole="button"
              accessibilityLabel="후우 시작하기"
              onPress={beginSessionFromPress}
              pressedScale={0.992}
              style={hooStyles.fullScreenPress}
            >
              <Image source={hooOnboardingImage} style={hooStyles.fullBleedImage} resizeMode="cover" />
            </HooTactilePressable>
          </HooScreenFade>
        )}


        {isHooSessionScreen && (
          <HooScreenFade>
          <HooSessionStage
            width={width}
            height={height}
            viewportHeight={visibleSessionHeight}
            breathIndex={flowState.screen === 'prepare' ? 1 : flowState.breathIndex}
            showProgress={flowState.screen !== 'prepare'}
            title={
              isMicPermissionRequestPending
                ? ''
                : needsMicPermission
                ? '마이크를 허용해주세요'
                : flowState.screen === 'prepare'
                ? `${prepareCountdown}`
                : flowState.screen === 'complete'
                  ? '숨고르기 완료'
                  : flowState.screen === 'failed'
                    ? '방울을 만들지 못했어요'
                    : currentCopy.title
            }
            titleStyle={needsMicPermission ? 'instruction' : flowState.screen === 'prepare' ? 'countdown' : 'instruction'}
            subtitle={
              firstExhaleGuideCopy
                ? firstExhaleGuideCopy
                : isMicPermissionRequestPending
                ? null
                : needsMicPermission
                ? '호흡을 시작하기 전에 필요해요'
                : flowState.screen === 'prepare'
                ? null
                : flowState.screen === 'complete'
                  ? null
                  : flowState.screen === 'failed'
                    ? '다시 천천히 불어볼까요?'
                    : null
            }
            phaseRemainingSeconds={flowState.screen === 'breathing' ? phaseRemainingSeconds : null}
            breathPhase={flowState.breathPhase}
            shouldUseStaticBackground={shouldUseStaticSessionBackground}
            showInhaleFlow={flowState.screen === 'breathing' && flowState.breathPhase === 'inhale'}
            characterSource={getHooCollectionImageSource(selectedHooCollectionCharacter.imageKey)}
            characterMode={
              flowState.screen === 'prepare'
                ? 'hidden'
                : flowState.screen === 'complete'
                  ? 'large'
                    : flowState.screen === 'failed'
                      ? 'hidden'
                      : isFinalExhale
                    ? isFinalCharacterCaptured
                      ? 'capture'
                      : 'small'
                    : isFinalInhale
                      ? 'small'
                      : 'hidden'
            }
            floatingBubbles={flowState.screen === 'breathing' ? floatingBubbles : []}
            captureIntensity={
              flowState.screen === 'complete'
                ? 1
                : isFinalCharacterCaptured
                  ? volumeLevel
                  : 0
            }
            playWandEntrance={flowState.screen === 'prepare' || flowState.screen === 'breathing'}
            isCharacterFlying={isFinalInhale || (isFinalExhale && !isFinalCharacterCaptured)}
            showMicPermissionPrompt={needsMicPermission}
            micNotice={micNotice}
            onRequestMicPermission={requestMicPermissionFromPress}
            onBack={backToOnboarding}
            accessibilityLabel={
              flowState.screen === 'complete'
                ? `숨고르기 완료, 캐릭터 ${flowState.collectedCharacters}개 수집`
                : flowState.screen === 'failed'
                  ? '방울을 만들지 못했어요'
                : undefined
            }
            footer={
              flowState.screen === 'complete' || flowState.screen === 'failed' ? (
                <View
                  style={[
                    hooStyles.completeButtons,
                    {
                      left: completionButtonLayout.left,
                      top: completionButtonLayout.top,
                      width: completionButtonLayout.width,
                      height: completionButtonLayout.height,
                    },
                  ]}
                >
                  <View
                    pointerEvents="none"
                    style={[
                      hooStyles.completeButtonShape,
                      hooStyles.completeButtonShapeMuted,
                      { left: 0, width: x(163.5, width) },
                    ]}
                  />
                  <View
                    pointerEvents="none"
                    style={[
                      hooStyles.completeButtonShape,
                      hooStyles.completeButtonShapePrimary,
                      { left: x(171.5, width), width: x(163.5, width) },
                    ]}
                  />
                  <Text
                    pointerEvents="none"
                    style={[
                      hooStyles.completeButtonLabel,
                      hooStyles.completeButtonLabelMuted,
                      { left: 0, width: x(163.5, width) },
                    ]}
                  >
                    다시하기
                  </Text>
                  <Text
                    pointerEvents="none"
                    style={[
                      hooStyles.completeButtonLabel,
                      hooStyles.completeButtonLabelPrimary,
                      { left: x(171.5, width), width: x(163.5, width) },
                    ]}
                  >
                    도감 보기
                  </Text>
                  <HooTactilePressable
                    accessibilityRole="button"
                    accessibilityLabel="다시하기"
                    onPress={restartSession}
                    pressedScale={0.975}
                    style={[
                      hooStyles.completeButtonHit,
                      { left: 0, width: x(163.5, width) },
                    ]}
                    pressOverlayStyle={hooStyles.completeButtonPressOverlay}
                  />
                  <HooTactilePressable
                    accessibilityRole="button"
                    accessibilityLabel="도감 보기"
                    onPress={openHooCollection}
                    pressedScale={0.975}
                    style={[
                      hooStyles.completeButtonHit,
                      { left: x(171.5, width), width: x(163.5, width) },
                    ]}
                    pressOverlayStyle={hooStyles.completeButtonPressOverlay}
                  />
                </View>
              ) : undefined
            }
          />
          </HooScreenFade>
        )}
        {flowState.screen === 'collection' && (
          <HooScreenFade>
            <HooCollectionScreen
              width={width}
              height={visibleSessionHeight}
              bottomInset={0}
              collectionState={collectionState}
              selectedCategory={collectionCategory}
              onSelectCategory={setCollectionCategory}
              onBack={() => {
                setFlowState((currentState) => ({
                  ...currentState,
                  screen: currentState.collectedCharacters > 0 ? 'complete' : 'onboarding',
                }));
              }}
            />
          </HooScreenFade>
        )}
        {flowState.screen === 'complete' && isCollectionCaptureSheetVisible && lastCollectionCapture && (
          <HooCollectionCaptureSheet
            width={width}
            height={visibleSessionHeight}
            bottomInset={0}
            character={lastCollectionCapture.character}
            isNewCapture={lastCollectionCapture.isNewCapture}
            summary={collectionSummary}
            onOpenCollection={openHooCollection}
            onDismiss={dismissCollectionCaptureSheet}
          />
        )}
        {isGuideOpen && (
          <HooGuidePopup
            width={width}
            height={visibleSessionHeight}
            onStart={acknowledgeGuide}
            onClose={backToOnboarding}
          />
        )}
      </View>
    </View>
  );
}

// 화면이 마운트될 때 부드럽게 떠오르듯 페이드인(opacity + 살짝 스케일·드리프트).
function HooScreenFade({ children }: { children: ReactNode }) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.986, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const HOO_COLLECTION_CATEGORY_TABS: Array<{ value: HooCollectionCategory; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'sea', label: '바다' },
  { value: 'forest', label: '숲' },
  { value: 'sky', label: '하늘' },
];

function getHooCollectionImageSource(imageKey: string) {
  return hooCollectionImageSources[imageKey] ?? hooCollectionCharacters[0];
}

function HooCollectionCaptureSheet({
  width,
  height,
  bottomInset,
  character,
  isNewCapture,
  summary,
  onOpenCollection,
  onDismiss,
}: {
  width: number;
  height: number;
  bottomInset: number;
  character: HooCollectionCharacter;
  isNewCapture: boolean;
  summary: HooCollectionSummary;
  onOpenCollection: () => void;
  onDismiss: () => void;
}) {
  const progressWidth = `${Math.round((summary.capturedCount / summary.totalCount) * 100)}%` as ViewStyle['width'];
  const sheetEnter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    sheetEnter.setValue(0);
    Animated.timing(sheetEnter, {
      toValue: 1,
      duration: HOO_COLLECTION_CAPTURE_SHEET_SLIDE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sheetEnter]);

  return (
    <View style={hooStyles.collectionSheetOverlay}>
      <HooTactilePressable
        accessibilityRole="button"
        accessibilityLabel="도감 기록 안내 닫기"
        onPress={onDismiss}
        style={hooStyles.collectionSheetBackdrop}
        pressedScale={1}
      />
      <Animated.View
        style={[
          hooStyles.collectionSheet,
          {
            left: x(18, width),
            right: x(18, width),
            bottom: bottomInset + y(14, height),
            paddingBottom: y(18, height),
            opacity: sheetEnter,
            transform: [
              {
                translateY: sheetEnter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [y(42, height), 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={hooStyles.collectionSheetGrabber} />
        <View style={hooStyles.collectionSheetCharacterRing}>
          <Image
            source={getHooCollectionImageSource(character.imageKey)}
            style={hooStyles.collectionSheetCharacter}
            resizeMode="contain"
          />
        </View>
        <Text style={[hooStyles.collectionSheetTitle, { fontSize: s(24, width) }]} allowFontScaling={false}>
          도감에 기록됐어요
        </Text>
        <Text style={hooStyles.collectionSheetSubtitle} allowFontScaling={false}>
          {isNewCapture ? `${character.name}를 새로 만났어요` : `${character.name}를 다시 만났어요`}
        </Text>

        <View style={hooStyles.collectionSheetProgressBlock}>
          <View style={hooStyles.collectionSheetProgressRow}>
            <Text style={hooStyles.collectionSheetCount} allowFontScaling={false}>{summary.capturedCount}</Text>
            <Text style={hooStyles.collectionSheetTotal} allowFontScaling={false}> / {summary.totalCount}</Text>
            <Text style={hooStyles.collectionSheetProgressMeta} allowFontScaling={false}>모은 캐릭터</Text>
          </View>
          <View style={hooStyles.collectionSheetProgressTrack}>
            <View style={[hooStyles.collectionSheetProgressFill, { width: progressWidth }]} />
          </View>
        </View>

        <HooTactilePressable
          accessibilityRole="button"
          accessibilityLabel="도감에서 보기"
          onPress={onOpenCollection}
          pressedScale={0.985}
          style={hooStyles.collectionSheetPrimary}
          pressOverlayStyle={hooStyles.collectionSheetPrimaryOverlay}
        >
          <Text style={hooStyles.collectionSheetPrimaryText} allowFontScaling={false}>도감에서 보기</Text>
        </HooTactilePressable>
        <HooTactilePressable
          accessibilityRole="button"
          accessibilityLabel="나중에 볼게요"
          onPress={onDismiss}
          pressedScale={0.98}
          style={hooStyles.collectionSheetSecondary}
        >
          <Text style={hooStyles.collectionSheetSecondaryText} allowFontScaling={false}>나중에 볼게요</Text>
        </HooTactilePressable>
      </Animated.View>
    </View>
  );
}

function HooCollectionScreen({
  width,
  height,
  bottomInset,
  collectionState,
  selectedCategory,
  onSelectCategory,
  onBack,
}: {
  width: number;
  height: number;
  bottomInset: number;
  collectionState: HooCollectionState;
  selectedCategory: HooCollectionCategory;
  onSelectCategory: (category: HooCollectionCategory) => void;
  onBack: () => void;
}) {
  const summary = getHooCollectionSummary(collectionState);
  const items = getHooCollectionViewItems(collectionState, selectedCategory);
  const capturedItems = getHooCollectionViewItems(collectionState, 'all').filter((item) => item.captured);
  const recentItem =
    capturedItems.find((item) => item.character.id === summary.recentCharacterId)
    ?? capturedItems[capturedItems.length - 1]
    ?? null;
  const progressWidth = `${Math.round((summary.capturedCount / summary.totalCount) * 100)}%` as ViewStyle['width'];
  const gridPadding = x(22, width);
  const gridGap = x(16, width);
  const cardSize = (width - gridPadding * 2 - gridGap * 2) / 3;

  return (
    <LinearGradient
      colors={['#F8FCFF', '#EAF2F7', '#F7FBFC']}
      locations={[0, 0.52, 1]}
      style={hooStyles.collectionScreen}
    >
      <View style={[hooStyles.collectionHeader, { top: y(55, height) }]}>
        <HooTactilePressable
          accessibilityRole="button"
          accessibilityLabel="도감에서 돌아가기"
          onPress={onBack}
          pressedScale={0.92}
          style={[hooStyles.collectionBackButton, { left: x(22, width) }]}
          pressOverlayStyle={hooStyles.collectionBackButtonOverlay}
        >
          <Image source={hooBackChevron} style={hooStyles.collectionBackIcon} resizeMode="contain" />
        </HooTactilePressable>
        <Text style={[hooStyles.collectionTitle, { fontSize: s(30, width) }]} allowFontScaling={false}>
          후우 도감
        </Text>
      </View>

      <View
        style={[
          hooStyles.collectionSummaryCard,
          {
            left: x(22, width),
            right: x(22, width),
            top: y(151, height),
            height: y(142, height),
          },
        ]}
      >
        <View style={hooStyles.collectionSummaryImageWrap}>
          <Image
            source={getHooCollectionImageSource(recentItem?.character.imageKey ?? 'hoo-collection-empty-01-butterfly')}
            style={hooStyles.collectionSummaryImage}
            resizeMode="contain"
          />
        </View>
        <View style={hooStyles.collectionSummaryCopy}>
          <Text style={hooStyles.collectionSummaryEyebrow} allowFontScaling={false}>최근 만난 후우</Text>
          <View style={hooStyles.collectionSummaryCountRow}>
            <Text style={hooStyles.collectionSummaryCount} allowFontScaling={false}>{summary.capturedCount}</Text>
            <Text style={hooStyles.collectionSummaryTotal} allowFontScaling={false}> / {summary.totalCount}</Text>
          </View>
          <View style={hooStyles.collectionProgressTrack}>
            <View style={[hooStyles.collectionProgressFill, { width: progressWidth }]} />
          </View>
        </View>
      </View>

      <View
        style={[
          hooStyles.collectionTabs,
          {
            left: x(22, width),
            right: x(22, width),
            top: y(310, height),
          },
        ]}
      >
        {HOO_COLLECTION_CATEGORY_TABS.map((tab) => {
          const isSelected = selectedCategory === tab.value;

          return (
            <HooTactilePressable
              key={tab.value}
              accessibilityRole="button"
              accessibilityLabel={`${tab.label} 후우 보기`}
              onPress={() => onSelectCategory(tab.value)}
              pressedScale={0.96}
              style={[hooStyles.collectionTab, isSelected && hooStyles.collectionTabActive]}
              pressOverlayStyle={hooStyles.collectionTabOverlay}
            >
              <Text
                style={[hooStyles.collectionTabText, isSelected && hooStyles.collectionTabTextActive]}
                allowFontScaling={false}
              >
                {tab.label}
              </Text>
            </HooTactilePressable>
          );
        })}
      </View>

      <ScrollView
        style={[
          hooStyles.collectionGridScroll,
          {
            top: y(382, height),
            bottom: bottomInset + y(10, height),
          },
        ]}
        contentContainerStyle={[
          hooStyles.collectionGrid,
          {
            paddingHorizontal: gridPadding,
            gap: gridGap,
            paddingBottom: y(26, height),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <View
            key={item.character.id}
            style={[
              hooStyles.collectionCard,
              item.captured && hooStyles.collectionCardCaptured,
              item.character.id === summary.recentCharacterId && hooStyles.collectionCardRecent,
              {
                width: cardSize,
                height: cardSize + y(26, height),
              },
            ]}
          >
            <Image
              source={getHooCollectionImageSource(item.selectedImageKey)}
              style={[
                hooStyles.collectionCardImage,
                {
                  width: cardSize,
                  height: cardSize,
                },
              ]}
              resizeMode="contain"
            />
            {item.captured ? (
              <Text style={hooStyles.collectionCardName} numberOfLines={1} allowFontScaling={false}>
                {item.character.name}
              </Text>
            ) : (
              <View style={hooStyles.collectionCardEmptyNameSlot} />
            )}
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const HOO_GUIDE_STEPS = [
  { n: '1', title: '천천히 숨 들이마시기' },
  { n: '2', title: '마이크에 후-우 불기' },
  { n: '3', title: '마지막엔 큰 방울 만들기' },
];

function HooGuidePopup({
  width,
  height,
  onStart,
  onClose,
}: {
  width: number;
  height: number;
  onStart: () => void;
  onClose: () => void;
}) {
  const cardWidth = Math.min(s(340, width), width - s(40, width));
  const guideLayout = getHooResponsiveLayout({ screenWidth: width, screenHeight: height });
  const guideCompactness = getHooSessionElementLayout(guideLayout).guideCompactness;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  // 버튼을 누르면 팝업이 부드럽게 사라진 뒤 실제 동작(시작/닫기)을 실행한다.
  const runExit = useCallback(
    (after: () => void) => {
      Animated.timing(enter, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          after();
        }
      });
    },
    [enter],
  );

  return (
    <View style={hooStyles.guideOverlay}>
      <Animated.View pointerEvents="none" style={[hooStyles.guideBackdrop, { opacity: enter }]} />
      <Animated.View
        style={[
          hooStyles.guideCard,
          {
            width: cardWidth,
            paddingTop: 34 - 8 * guideCompactness,
            paddingBottom: 22 - 6 * guideCompactness,
            opacity: enter,
            transform: [
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
              { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
            ],
          },
        ]}
      >
        <HooTactilePressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={() => runExit(onClose)}
          pressedScale={0.9}
          style={hooStyles.guideClose}
        >
          <Text style={hooStyles.guideCloseText} allowFontScaling={false}>✕</Text>
        </HooTactilePressable>

        <Image
          source={hooBubbleSelected}
          style={[
            hooStyles.guideBubbleIcon,
            {
              width: 52 - 8 * guideCompactness,
              height: 52 - 8 * guideCompactness,
              marginBottom: 10 - 4 * guideCompactness,
            },
          ]}
          resizeMode="contain"
        />
        <Text
          style={[
            hooStyles.guideTitle,
            {
              fontSize: 23 - 2 * guideCompactness,
              marginBottom: 18 - 8 * guideCompactness,
            },
          ]}
          allowFontScaling={false}
        >
          후우, 이렇게 해요
        </Text>

        <View style={hooStyles.guideSteps}>
          {HOO_GUIDE_STEPS.map((step, index) => (
            <View key={step.n}>
              {index > 0 && <View style={hooStyles.guideDivider} />}
              <View style={[hooStyles.guideStepRow, { paddingVertical: 13 - 4 * guideCompactness }]}>
                <View style={hooStyles.guideStepNumber}>
                  <Text style={hooStyles.guideStepNumberText} allowFontScaling={false}>{step.n}</Text>
                </View>
                <View style={hooStyles.guideStepTexts}>
                  <Text style={hooStyles.guideStepTitle} allowFontScaling={false}>{step.title}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            hooStyles.guideNote,
            {
              paddingVertical: 12 - 3 * guideCompactness,
              marginTop: 14 - 4 * guideCompactness,
              marginBottom: 16 - 5 * guideCompactness,
            },
          ]}
        >
          <Text style={hooStyles.guideNoteText} allowFontScaling={false}>🔊  소리를 켜면 더 좋아요</Text>
        </View>

        <HooTactilePressable
          accessibilityRole="button"
          accessibilityLabel="시작하기"
          onPress={() => runExit(onStart)}
          pressedScale={0.98}
          style={[hooStyles.guideStartButton, { height: 56 - 4 * guideCompactness }]}
          pressOverlayStyle={hooStyles.guideStartButtonOverlay}
        >
          <Text style={hooStyles.guideStartButtonText} allowFontScaling={false}>시작하기</Text>
        </HooTactilePressable>
      </Animated.View>
    </View>
  );
}

type HooSessionCopySnapshot = {
  title: string;
  subtitle: string | null;
  titleStyle: 'countdown' | 'instruction';
};

function HooSessionStage({
  width,
  height,
  viewportHeight,
  breathIndex,
  showProgress,
  title,
  titleStyle,
  subtitle,
  phaseRemainingSeconds = null,
  breathPhase,
  shouldUseStaticBackground,
  showInhaleFlow,
  characterSource,
  characterMode,
  floatingBubbles,
  captureIntensity,
  playWandEntrance,
  isCharacterFlying,
  showMicPermissionPrompt,
  micNotice,
  footer,
  accessibilityLabel,
  onRequestMicPermission,
  onBack,
}: {
  width: number;
  height: number;
  viewportHeight: number;
  breathIndex: number;
  showProgress: boolean;
  title: string;
  titleStyle: 'countdown' | 'instruction';
  subtitle: string | null;
  phaseRemainingSeconds?: number | null;
  breathPhase: HooBreathPhase;
  shouldUseStaticBackground: boolean;
  showInhaleFlow: boolean;
  characterSource: ImageSourcePropType;
  characterMode: 'hidden' | 'small' | 'capture' | 'large';
  floatingBubbles: HooBubble[];
  captureIntensity: number;
  playWandEntrance: boolean;
  isCharacterFlying: boolean;
  showMicPermissionPrompt: boolean;
  micNotice: string | null;
  footer?: ReactNode;
  accessibilityLabel?: string;
  onRequestMicPermission: () => void;
  onBack: () => void;
}) {
  const sessionResponsiveLayout = {
    width,
    height,
    isFramed: false,
    screenWidth: width,
    screenHeight: viewportHeight,
    shortScreenRatio: getHooResponsiveLayout({ screenWidth: width, screenHeight: viewportHeight }).shortScreenRatio,
  };
  const sessionElementLayout = getHooSessionElementLayout(sessionResponsiveLayout);
  const characterSize = characterMode === 'large' ? s(232, width) : characterMode === 'capture' ? s(116, width) : s(66, width);
  const characterLeft = characterMode === 'large' ? x(84, width) : characterMode === 'capture' ? x(209, width) : x(241, width);
  const characterTop = characterMode === 'large'
    ? y(349, height) - sessionElementLayout.copyLift * 0.32
    : characterMode === 'capture'
      ? y(318, height) - sessionElementLayout.copyLift
      : y(346, height) - sessionElementLayout.copyLift;
  const bubbleSize = s(257, width);
  const completionCharacterLayout = getHooCompletionCharacterLayout({
    layout: sessionResponsiveLayout,
    bubbleSize,
    characterSize,
  });
  const captureBubbleSize = s(116 + captureIntensity * 92, width);
  const wandScale = sessionElementLayout.wandScale;
  const wandBaseWidth = s(320, width);
  const wandWidth = wandBaseWidth * wandScale;
  const wandHeight = s(443, width) * wandScale;
  const wandLeft = x(44, width) + (wandBaseWidth - wandWidth) / 2;
  const visualBreathIndex = breathIndex;
  const wandEntrance = useRef(new Animated.Value(0)).current;
  const hasPlayedWandEntranceRef = useRef(false);
  const copyTransition = useRef(new Animated.Value(1)).current;
  const phaseTimerTransition = useRef(new Animated.Value(phaseRemainingSeconds === null ? 0 : 1)).current;
  const inhaleFlow = useRef(new Animated.Value(0)).current;
  const completionEntrance = useRef(new Animated.Value(characterMode === 'large' ? 0 : 1)).current;
  const captureEntrance = useRef(new Animated.Value(characterMode === 'capture' ? 1 : 0)).current;
  const characterFlightX = useRef(new Animated.Value(0)).current;
  const characterFlightY = useRef(new Animated.Value(0)).current;
  const characterFlightTilt = useRef(new Animated.Value(0)).current;
  const characterFlightScale = useRef(new Animated.Value(1)).current;
  const [displayedCopy, setDisplayedCopy] = useState<HooSessionCopySnapshot>({ title, subtitle, titleStyle });
  const [displayedPhaseRemainingSeconds, setDisplayedPhaseRemainingSeconds] = useState<number | null>(phaseRemainingSeconds);
  const [outgoingPhaseRemainingSeconds, setOutgoingPhaseRemainingSeconds] = useState<number | null>(null);
  const currentCopyRef = useRef<HooSessionCopySnapshot>(displayedCopy);
  const phaseTimerValueRef = useRef<number | null>(phaseRemainingSeconds);
  const phaseTimerToneStyle = breathPhase === 'inhale' ? hooStyles.phaseTimerTextInhale : hooStyles.phaseTimerTextExhale;
  const inhaleAirParticles = useMemo(
    () => [
      { id: 'left-high', left: 114, top: 472, toX: 68, toY: 34, size: 5, opacity: 0.22 },
      { id: 'right-high', left: 252, top: 466, toX: -58, toY: 38, size: 4, opacity: 0.26 },
      { id: 'left-low', left: 151, top: 604, toX: 34, toY: -92, size: 6, opacity: 0.18 },
      { id: 'right-low', left: 236, top: 594, toX: -40, toY: -84, size: 5, opacity: 0.2 },
      { id: 'top-center', left: 188, top: 427, toX: 2, toY: 77, size: 4, opacity: 0.24 },
      { id: 'far-left', left: 88, top: 538, toX: 96, toY: -30, size: 3.5, opacity: 0.18 },
      { id: 'far-right', left: 284, top: 538, toX: -90, toY: -34, size: 3.5, opacity: 0.18 },
      { id: 'bottom-center', left: 178, top: 648, toX: 10, toY: -135, size: 4, opacity: 0.16 },
    ],
    [],
  );

  useEffect(() => {
    if (!playWandEntrance) {
      wandEntrance.setValue(hasPlayedWandEntranceRef.current ? 1 : 0);
      return;
    }

    if (hasPlayedWandEntranceRef.current) {
      wandEntrance.setValue(1);
      return;
    }

    hasPlayedWandEntranceRef.current = true;
    wandEntrance.setValue(0);
    Animated.timing(wandEntrance, {
      toValue: 1,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [playWandEntrance, wandEntrance]);

	  useEffect(() => {
	    const nextCopy = { title, subtitle, titleStyle };
	    const currentCopy = currentCopyRef.current;
	    if (
	      currentCopy.title === nextCopy.title
      && currentCopy.subtitle === nextCopy.subtitle
      && currentCopy.titleStyle === nextCopy.titleStyle
    ) {
      return;
	    }
	
	    currentCopyRef.current = nextCopy;
	    copyTransition.stopAnimation();
	    const isCountdownCopyChange = currentCopy.titleStyle === 'countdown' && nextCopy.titleStyle === 'countdown';
      if (isCountdownCopyChange) {
        setDisplayedCopy(nextCopy);
        copyTransition.setValue(1);
        return;
      }

	    Animated.timing(copyTransition, {
	      toValue: 0,
	      duration: Math.round(HOO_COPY_FADE_MS * 0.42),
	      easing: Easing.out(Easing.cubic),
	      useNativeDriver: true,
	    }).start(({ finished }) => {
	      if (finished) {
	        setDisplayedCopy(nextCopy);
	        copyTransition.setValue(0);
	        Animated.timing(copyTransition, {
	          toValue: 1,
	          duration: HOO_COPY_FADE_MS,
	          easing: Easing.out(Easing.cubic),
	          useNativeDriver: true,
	        }).start();
	      }
    });
  }, [copyTransition, subtitle, title, titleStyle]);

  useEffect(() => {
    if (phaseTimerValueRef.current === phaseRemainingSeconds) {
      return;
    }

    const previousPhaseRemainingSeconds = phaseTimerValueRef.current;
    phaseTimerValueRef.current = phaseRemainingSeconds;
    phaseTimerTransition.stopAnimation();
    setOutgoingPhaseRemainingSeconds(previousPhaseRemainingSeconds);
    setDisplayedPhaseRemainingSeconds(phaseRemainingSeconds);
    phaseTimerTransition.setValue(0);
    Animated.timing(phaseTimerTransition, {
      toValue: 1,
      duration: HOO_TIMER_FADE_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setOutgoingPhaseRemainingSeconds(null);
    });
  }, [phaseRemainingSeconds, phaseTimerTransition]);

  useEffect(() => {
    if (!showInhaleFlow) {
      inhaleFlow.stopAnimation();
      inhaleFlow.setValue(0);
      return;
    }

    inhaleFlow.setValue(0);
    const inhaleFlowLoop = Animated.loop(
      Animated.timing(inhaleFlow, {
        toValue: 1,
        duration: getHooPhaseDurationMs('inhale'),
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    inhaleFlowLoop.start();

    return () => {
      inhaleFlowLoop.stop();
    };
  }, [inhaleFlow, showInhaleFlow]);

  useEffect(() => {
    if (characterMode !== 'large') {
      completionEntrance.setValue(1);
      return;
    }

    completionEntrance.setValue(0);
    Animated.timing(completionEntrance, {
      toValue: 1,
      duration: HOO_COMPLETION_FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [characterMode, completionEntrance]);

  useEffect(() => {
    captureEntrance.stopAnimation();
    if (characterMode !== 'capture') {
      captureEntrance.setValue(0);
      return;
    }

    captureEntrance.setValue(0);
    Animated.timing(captureEntrance, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [captureEntrance, characterMode]);

  useEffect(() => {
    if (!isCharacterFlying) {
      characterFlightX.stopAnimation();
      characterFlightY.stopAnimation();
      characterFlightTilt.stopAnimation();
      characterFlightScale.stopAnimation();
      characterFlightX.setValue(0);
      characterFlightY.setValue(0);
      characterFlightTilt.setValue(0);
      characterFlightScale.setValue(1);
      return;
    }

    let isFlightCancelled = false;
    const animateCharacterFlight = () => {
      const nextX = x(-155 + Math.random() * 235, width);
      const nextY = y(-135 + Math.random() * 230, height);
      const nextTilt = -1 + Math.random() * 2;
      const nextScale = 0.95 + Math.random() * 0.16;

      Animated.parallel([
        Animated.timing(characterFlightX, {
          toValue: nextX,
          duration: 860 + Math.random() * 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(characterFlightY, {
          toValue: nextY,
          duration: 860 + Math.random() * 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(characterFlightTilt, {
          toValue: nextTilt,
          duration: 860 + Math.random() * 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(characterFlightScale, {
          toValue: nextScale,
          duration: 860 + Math.random() * 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && !isFlightCancelled) {
          animateCharacterFlight();
        }
      });
    };

    characterFlightX.setValue(0);
    characterFlightY.setValue(0);
    characterFlightTilt.setValue(0);
    characterFlightScale.setValue(1);
    animateCharacterFlight();

    return () => {
      isFlightCancelled = true;
      characterFlightX.stopAnimation();
      characterFlightY.stopAnimation();
      characterFlightTilt.stopAnimation();
      characterFlightScale.stopAnimation();
    };
  }, [
    characterFlightScale,
    characterFlightTilt,
    characterFlightX,
    characterFlightY,
    height,
    isCharacterFlying,
    width,
  ]);

  const wandEntranceStyle = {
    opacity: wandEntrance.interpolate({
      inputRange: [0, 0.34, 1],
      outputRange: [0, 0.86, 1],
    }),
    transform: [
      {
        translateY: wandEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [height * 0.28, 0],
        }),
      },
      {
        scale: wandEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  };
  const hooCopyTransitionStyle = {
    opacity: copyTransition,
  };
  const hooPhaseTimerTransitionStyle = {
    opacity: phaseTimerTransition.interpolate({
      inputRange: [0, 0.12, 1],
      outputRange: [0.86, 1, 1],
    }),
  };
  const hooPhaseTimerIncomingTextStyle = {
    opacity: phaseTimerTransition,
  };
  const hooPhaseTimerOutgoingTextStyle = {
    opacity: phaseTimerTransition.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
  };
  const characterFlightStyle = isCharacterFlying
    ? {
        transform: [
          { translateX: characterFlightX },
          { translateY: characterFlightY },
          {
            rotate: characterFlightTilt.interpolate({
              inputRange: [-1, 1],
              outputRange: ['-12deg', '12deg'],
            }),
          },
          { scale: characterFlightScale },
        ],
      }
    : null;
  const captureCharacterStyle = characterMode === 'capture'
    ? {
        opacity: captureEntrance.interpolate({
          inputRange: [0, 0.22, 1],
          outputRange: [0, 1, 1],
        }),
        transform: [
          {
            translateX: captureEntrance.interpolate({
              inputRange: [0, 1],
              outputRange: [x(72, width), 0],
            }),
          },
          {
            translateY: captureEntrance.interpolate({
              inputRange: [0, 1],
              outputRange: [-y(160, height), 0],
            }),
          },
          {
            scale: captureEntrance.interpolate({
              inputRange: [0, 0.72, 1],
              outputRange: [0.68, 0.92, 0.9],
            }),
          },
        ],
      }
    : null;
  const hooCompletionEntranceStyle = characterMode === 'large'
    ? {
        opacity: completionEntrance,
        transform: [
          {
            translateY: completionEntrance.interpolate({
              inputRange: [0, 1],
              outputRange: [y(18, height), 0],
            }),
          },
          {
            scale: completionEntrance.interpolate({
              inputRange: [0, 1],
              outputRange: [0.985, 1],
            }),
          },
        ],
      }
    : null;
  const sessionBackgroundLiftY = y(96, height);
  const sessionBackgroundFrameStyle = {
    width,
    height: height + sessionBackgroundLiftY,
    top: -sessionBackgroundLiftY,
  };

  return (
    <View style={hooStyles.screen} accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel}>
      {shouldUseStaticBackground ? (
        <Image
          source={hooSessionBackgroundPoster}
          style={[hooStyles.sessionBackgroundVideo, sessionBackgroundFrameStyle]}
          resizeMode="cover"
        />
      ) : (
        <Video
          source={hooSessionBackgroundVideo}
          style={[hooStyles.sessionBackgroundVideo, sessionBackgroundFrameStyle]}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          usePoster
          posterSource={hooSessionBackgroundPoster}
          posterStyle={[hooStyles.sessionBackgroundVideo, sessionBackgroundFrameStyle]}
        />
      )}
      <View pointerEvents="none" style={hooStyles.sessionSurfaceWash} />
      <View style={[hooStyles.hooHeader, { left: x(17, width), right: x(26, width), top: y(34, height) }]}>
        <HooTactilePressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          onPress={onBack}
          pressedScale={0.9}
          style={hooStyles.backButton}
        >
          <View style={hooStyles.backButtonFrame}>
            <Image
              source={hooBackChevron}
              style={[
                hooStyles.backChevronImage,
                {
                  width: s(11, width),
                  height: y(20, height),
                  transform: [{ translateX: x(-6, width) }],
                },
              ]}
              resizeMode="stretch"
            />
          </View>
        </HooTactilePressable>
        <Image
          source={hooLogoHeaderNode}
          style={[hooStyles.headerLogoNode, { width: s(80, width), height: y(36, height) }]}
          resizeMode="stretch"
        />
        <View style={hooStyles.headerCounter} accessibilityLabel={`${visualBreathIndex} / ${HOO_TOTAL_BREATHS}`}>
          <Text
            key={`hoo-header-counter-${visualBreathIndex}`}
            style={hooStyles.headerCounterText}
          >
            {visualBreathIndex} / {HOO_TOTAL_BREATHS}
          </Text>
        </View>
      </View>

      {showProgress && (
        visualBreathIndex === 1 ? (
          <Image
            source={hooProgress1}
            style={[
              hooStyles.breathDotsImage,
              {
                left: x(102, width),
                top: y(98, height),
                width: s(173, width),
                height: s(63, width),
              },
            ]}
            resizeMode="stretch"
            accessibilityLabel="1번째 숨 진행 상태"
          />
        ) : (
          <View
          pointerEvents="none"
          style={[
            hooStyles.breathDots,
            {
              left: x(118.6044921875, width),
              top: y(114.60407257080078, height),
              width: x(156.39593505859375, width),
              height: s(63, width),
            },
          ]}
        >
          {Array.from({ length: HOO_TOTAL_BREATHS }).map((_, index) => (
            <Image
              key={`dot-${index}`}
              source={hooProgressDot}
              style={[
                hooStyles.breathDotImage,
                {
                  left: s(index * 33.685279846191406, width),
                  top: 0,
                  width: s(21.654821395874023, width),
                  height: s(21.654821395874023, width),
                },
              ]}
              resizeMode="stretch"
            />
          ))}
          {Array.from({ length: Math.min(visualBreathIndex, HOO_TOTAL_BREATHS) }).map((_, index) => (
            <Image
              key={`active-dot-${index}`}
              source={hooProgressDotActive}
              style={[
                hooStyles.breathDotActiveImage,
                {
                  left: s(index * 33.685279846191406 - 16.6044921875, width),
                  top: s(-16.60407257080078, width),
                  width: s(63, width),
                  height: s(63, width),
                },
              ]}
              resizeMode="stretch"
            />
          ))}
          </View>
        )
      )}

      <View pointerEvents="none" style={hooStyles.floatingBubbleLayer}>
        {floatingBubbles.map((bubble) => (
          <HooFloatingBubble key={bubble.id} bubble={bubble} width={width} height={height} />
        ))}
      </View>

      {showInhaleFlow && (
        <View pointerEvents="none" style={hooStyles.inhaleFlowLayer}>
          <Animated.View
            style={[
              hooStyles.inhaleRingGlow,
              {
                left: x(105, width),
                top: y(419, height) - sessionElementLayout.copyLift,
                width: s(178, width),
                height: s(178, width),
                opacity: inhaleFlow.interpolate({
                  inputRange: [0, 0.46, 1],
                  outputRange: [0.07, 0.24, 0.08],
                }),
                transform: [
                  {
                    scale: inhaleFlow.interpolate({
                      inputRange: [0, 0.58, 1],
                      outputRange: [0.96, 1.04, 0.98],
                    }),
                  },
                ],
              },
            ]}
          />
          {inhaleAirParticles.map((particle) => (
            <Animated.View
              key={`inhale-air-${particle.id}`}
              style={[
                hooStyles.inhaleAirParticle,
                {
                  left: x(particle.left, width),
                  top: y(particle.top, height) - sessionElementLayout.copyLift,
                  width: s(particle.size, width),
                  height: s(particle.size, width),
                  opacity: inhaleFlow.interpolate({
                    inputRange: [0, 0.18, 0.72, 1],
                    outputRange: [0, particle.opacity, particle.opacity * 0.5, 0],
                  }),
                  transform: [
                    {
                      translateX: inhaleFlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, x(particle.toX, width)],
                      }),
                    },
                    {
                      translateY: inhaleFlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, y(particle.toY, height)],
                      }),
                    },
                    {
                      scale: inhaleFlow.interpolate({
                        inputRange: [0, 0.68, 1],
                        outputRange: [0.78, 1, 0.34],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}

      {showMicPermissionPrompt && characterMode !== 'large' && (
        <HooTactilePressable
          accessibilityRole="button"
          accessibilityLabel={micNotice ?? '마이크 허용'}
          onPress={onRequestMicPermission}
          pressedScale={0.97}
          style={[
            hooStyles.micPermissionPill,
            {
              left: x(122, width),
              top: y(showProgress ? 181 : 138, height),
              width: x(146, width),
              height: y(34, height),
            },
          ]}
        >
          <Text
            style={[
              hooStyles.micPermissionText,
              {
                fontSize: s(13, width),
                lineHeight: y(18, height),
              },
            ]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {micNotice ?? '마이크 허용'}
          </Text>
        </HooTactilePressable>
      )}


      <Animated.View
        accessible
        accessibilityLabel={displayedCopy.subtitle ? `${displayedCopy.title}. ${displayedCopy.subtitle}` : displayedCopy.title}
        style={[
          hooStyles.sessionCopy,
          hooCopyTransitionStyle,
          hooCompletionEntranceStyle,
          // 폰트 크기/위치는 표시 중인 글자(displayedCopy)와 같은 스냅샷의 titleStyle을 따라간다.
          // (prop titleStyle을 쓰면 전환 중 옛 글자가 새 스타일(초대형 카운트다운)로 렌더돼 화면을 덮음)
          { top: (displayedCopy.titleStyle === 'countdown' ? y(190, height) : y(227, height)) - sessionElementLayout.copyLift },
        ]}
      >
        <Text
          style={[
            displayedCopy.titleStyle === 'countdown' ? hooStyles.countdownText : hooStyles.instructionTitle,
            displayedCopy.titleStyle === 'countdown'
              ? { fontSize: s(80, width), lineHeight: s(99, width) }
              : { fontSize: s(24, width), lineHeight: s(29, width) },
          ]}
          allowFontScaling={false}
        >
          {displayedCopy.title}
        </Text>
        {displayedCopy.subtitle ? (
          <Text
            style={[hooStyles.instructionSubtitle, { fontSize: s(18, width), lineHeight: s(24, width) }]}
            allowFontScaling={false}
          >
            {displayedCopy.subtitle}
          </Text>
        ) : null}
      </Animated.View>

      {(displayedPhaseRemainingSeconds !== null || outgoingPhaseRemainingSeconds !== null) && characterMode !== 'large' && (
        <Animated.View
          pointerEvents="none"
          style={[
            hooStyles.phaseTimer,
            hooStyles.phaseTimerSubtitleSlot,
            hooPhaseTimerTransitionStyle,
            {
              left: x(162, width),
              top: y(257, height),
              width: x(66, width),
              height: y(42, height),
            },
          ]}
          accessibilityLabel={`${displayedPhaseRemainingSeconds ?? outgoingPhaseRemainingSeconds}초 남음`}
        >
          {outgoingPhaseRemainingSeconds !== null && (
            <Animated.Text
              style={[
                hooStyles.phaseTimerText,
                phaseTimerToneStyle,
                hooStyles.phaseTimerTextLayer,
                hooPhaseTimerOutgoingTextStyle,
                {
                  fontSize: s(32, width),
                  lineHeight: y(42, height),
                },
              ]}
              allowFontScaling={false}
            >
              {outgoingPhaseRemainingSeconds}
            </Animated.Text>
          )}
          {displayedPhaseRemainingSeconds !== null && (
            <Animated.Text
              style={[
                hooStyles.phaseTimerText,
                phaseTimerToneStyle,
                hooStyles.phaseTimerTextLayer,
                hooPhaseTimerIncomingTextStyle,
                {
                  fontSize: s(32, width),
                  lineHeight: y(42, height),
                },
              ]}
              allowFontScaling={false}
            >
              {displayedPhaseRemainingSeconds}
            </Animated.Text>
          )}
        </Animated.View>
      )}

      {characterMode === 'large' && (
        <Animated.View style={[hooStyles.completeCharacterFloat, hooCompletionEntranceStyle]}>
          <HooIdleFloat
            amplitudeX={1.4}
            amplitudeY={12}
            durationMs={6000}
            style={StyleSheet.absoluteFill}
          >
            <Image
              source={hooCompleteBubbleNode}
              style={[
                hooStyles.completeBubble,
                {
                  width: bubbleSize,
                  height: bubbleSize,
                  left: completionCharacterLayout.bubbleLeft,
                  top: completionCharacterLayout.bubbleTop,
                },
              ]}
              resizeMode="contain"
            />
            <Image
              source={characterSource}
              style={[
                hooStyles.hooCharacter,
                {
                  width: characterSize,
                  height: characterSize,
                  left: completionCharacterLayout.characterLeft,
                  top: completionCharacterLayout.characterTop,
                },
              ]}
              resizeMode="contain"
            />
          </HooIdleFloat>
        </Animated.View>
      )}
      {characterMode === 'capture' && (
        <Image
          source={hooBubbleSelected}
          style={[
            hooStyles.captureBubble,
            {
              width: captureBubbleSize,
              height: captureBubbleSize,
              left: characterLeft + characterSize / 2 - captureBubbleSize / 2,
              top: characterTop + characterSize / 2 - captureBubbleSize / 2,
              opacity: 0.58 + captureIntensity * 0.22,
            },
          ]}
          resizeMode="contain"
        />
      )}
      {characterMode !== 'hidden' && characterMode !== 'large' && (
        <Animated.Image
          source={characterSource}
          style={[
            hooStyles.hooCharacter,
            hooCompletionEntranceStyle,
            characterFlightStyle,
            captureCharacterStyle,
            { width: characterSize, height: characterSize, left: characterLeft, top: characterTop },
          ]}
          resizeMode="contain"
        />
      )}

      {characterMode !== 'large' && (
        <Animated.Image
          source={hooWandSessionNode}
          style={[
            hooStyles.hooWand,
            wandEntranceStyle,
            {
              left: wandLeft,
              bottom: sessionElementLayout.wandBottom,
              width: wandWidth,
              height: wandHeight,
            },
          ]}
          resizeMode="stretch"
        />
      )}
      {characterMode === 'large' && footer ? (
        <Animated.View pointerEvents="box-none" style={[hooStyles.completionFooterMotion, hooCompletionEntranceStyle]}>
          {footer}
        </Animated.View>
      ) : (
        footer
      )}
    </View>
  );
}

function HooFloatingBubble({ bubble, width, height }: { bubble: HooBubble; width: number; height: number }) {
  const rise = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const bubbleSize = s(bubble.size, width);

  useEffect(() => {
    rise.setValue(0);
    pop.setValue(0);
    // 0) 방울마다 살짝 다른 딜레이로 시작(뭉침 방지) → 1) 떠올라 부채처럼 퍼지며 상승 → 2) "통!" 팝.
    Animated.sequence([
      Animated.delay(bubble.delayMs),
      Animated.timing(rise, {
        toValue: 1,
        duration: bubble.durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pop, {
        toValue: 1,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [bubble.delayMs, bubble.durationMs, rise, pop]);

  const translateY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -height * 0.34],
  });
  const translateX = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [0, x(bubble.driftX, width)],
  });
  // 상승 중엔 가득 보이다가, 팝 순간 빠르게 사라진다(밋밋한 페이드아웃 제거).
  const riseOpacity = rise.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, bubble.opacity, bubble.opacity],
  });
  const popOpacity = pop.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0.85, 0],
  });
  const opacity = Animated.multiply(riseOpacity, popOpacity);
  // 떠오르며 살짝 커지고(0.6→1.12), 팝 순간 확 부풀었다가 사라짐(×1.55).
  const riseScale = rise.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0.6, 1, 1.12],
  });
  const popScale = pop.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.4, 1.55],
  });
  const scale = Animated.multiply(riseScale, popScale);

  return (
    <Animated.View
      style={[
        hooStyles.floatingBubble,
        {
          width: bubbleSize,
          height: bubbleSize,
          left: (bubble.left / 100) * width - bubbleSize / 2,
          top: (bubble.top / 100) * height - bubbleSize / 2,
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <View style={hooStyles.floatingBubbleGlow} />
      <View style={hooStyles.floatingBubbleDepthCore} />
      <Image source={hooBubbleSelected} style={hooStyles.floatingBubbleImage} resizeMode="contain" />
      <View style={hooStyles.floatingBubbleSpecular} />
      <View style={hooStyles.floatingBubbleSpecularSmall} />
      <View style={hooStyles.floatingBubbleLowerRim} />
    </Animated.View>
  );
}

function OnboardingScreen({
  width,
  height,
  destination,
  onContinue,
}: {
  width: number;
  height: number;
  destination: Destination;
  onContinue: () => void;
}) {
  const [phase, setPhase] = useState<OnboardingPhase>('splash');
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const isChangingPhase = useRef(false);

  const showTicket = () => {
    if (isChangingPhase.current) {
      return;
    }

    isChangingPhase.current = true;
    setPhase('transition');

    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setPhase('ticket'));
  };

  return (
    <View style={styles.screen}>
      {(phase === 'transition' || phase === 'ticket') && (
        <TicketOnboarding
          key="ticket"
          width={width}
          height={height}
          destination={destination}
          onStart={onContinue}
          showContent={phase === 'ticket'}
          animateContent={phase === 'ticket'}
        />
      )}
      {(phase === 'splash' || phase === 'transition') && (
        <View key="splash-layer" pointerEvents="none" style={styles.onboardingLayer}>
          <SplashIntro
            width={width}
            height={height}
            opacity={splashOpacity}
            active={phase === 'splash'}
            onDone={showTicket}
          />
        </View>
      )}
    </View>
  );
}

function SplashIntro({
  width,
  opacity,
  active,
  onDone,
}: {
  width: number;
  height: number;
  opacity: Animated.Value;
  active: boolean;
  onDone: () => void;
}) {
  const didFinish = useRef(false);
  const logoFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      return;
    }

    const fallback = setTimeout(() => {
      if (!didFinish.current) {
        didFinish.current = true;
        onDone();
      }
    }, ONBOARDING_SPLASH_FALLBACK_MS);

    return () => {
      clearTimeout(fallback);
    };
  }, [active, onDone]);

  useEffect(() => {
    if (!active) {
      return;
    }

    logoFloat.setValue(0);
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();

    return () => {
      floatLoop.stop();
    };
  }, [active, logoFloat]);

  const logoFloatStyle = {
    transform: [
      {
        translateY: logoFloat.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -14],
        }),
      },
      {
        scale: logoFloat.interpolate({
          inputRange: [0, 1],
          outputRange: [0.992, 1.008],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.splashScreen, { opacity }]}>
      <LinearGradient
        colors={['#A4D6EF', '#BFE6F3', '#E7F7FB']}
        locations={[0, 0.56, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.Image
        source={hooLogo}
        style={[
          styles.splashLogo,
          logoFloatStyle,
          {
            width: Math.min(width * 0.46, 250),
            height: Math.min(width * 0.46, 250) * (941 / 1672),
          },
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function TicketOnboarding({
  width,
  height,
  destination,
  onStart,
  showContent = true,
  animateContent = true,
}: {
  width: number;
  height: number;
  destination: Destination;
  onStart: () => void;
  showContent?: boolean;
  animateContent?: boolean;
}) {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_400Regular, PlayfairDisplay_400Regular_Italic });
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(18)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(18)).current;
  const holdProgress = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didCompleteHold = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const styleId = 'dalsoom-ticket-bg-fix';
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      'img[src*="onboarding-cloud-ticket-bg.png"] { width: 100% !important; height: 100% !important; object-fit: cover !important; }';
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!showContent) {
      return;
    }

    const groups = [
      { opacity: heroOpacity, translateY: heroTranslateY },
      { opacity: buttonOpacity, translateY: buttonTranslateY },
    ];

    groups.forEach((group) => {
      group.opacity.setValue(animateContent ? 0 : 1);
      group.translateY.setValue(animateContent ? 18 : 0);
    });

    if (!animateContent) {
      return;
    }

    Animated.stagger(
      145,
      groups.map((group) =>
        Animated.parallel([
          Animated.timing(group.opacity, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(group.translateY, {
            toValue: 0,
            tension: 58,
            friction: 10,
            useNativeDriver: true,
          }),
        ]),
      ),
    ).start();
  }, [
    animateContent,
    buttonOpacity,
    buttonTranslateY,
    heroOpacity,
    heroTranslateY,
    showContent,
  ]);

  useEffect(
    () => () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
      }
    },
    [],
  );

  const completeJourneyHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    if (didCompleteHold.current) {
      return;
    }

    didCompleteHold.current = true;
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onStart();
      }
    });
  };

  const startJourneyHold = () => {
    if (holdTimer.current || didCompleteHold.current) {
      return;
    }

    didCompleteHold.current = false;
    holdProgress.stopAnimation();
    holdProgress.setValue(0);

    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
    }

    Animated.timing(holdProgress, {
      toValue: 1,
      duration: 1120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    holdTimer.current = setTimeout(completeJourneyHold, 1120);
  };

  const cancelJourneyHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    if (didCompleteHold.current) {
      return;
    }

    holdProgress.stopAnimation();
    Animated.spring(holdProgress, {
      toValue: 0,
      tension: 74,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const startCircleScale = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });
  const startCircleTranslateY = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const startGlowScale = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 4.8],
  });
  const startGlowOpacity = holdProgress.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0.18, 0.28, 0.56],
  });
  const startArrowTranslateY = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const holdArcRotate = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-46deg', '302deg'],
  });
  const holdRingOpacity = holdProgress.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0.36, 0.72, 1],
  });
  const fogOpacity = holdProgress.interpolate({
    inputRange: [0, 0.22, 0.62, 1],
    outputRange: [0, 0.32, 0.86, 0.96],
  });
  const fogTranslateY = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [22, -132],
  });
  const fogScale = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 4.8],
  });
  const arrivalPreviewOpacity = holdProgress.interpolate({
    inputRange: [0, 0.28, 0.74, 1],
    outputRange: [0, 0.26, 0.82, 1],
  });
  const arrivalPreviewScale = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.06, 1],
  });
  const cloudFadeOpacity = holdProgress.interpolate({
    inputRange: [0, 0.34, 1],
    outputRange: [1, 0.68, 0],
  });
  const contentExitOpacity = holdProgress.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [1, 0.86, 0],
  });
  const contentExitTranslateY = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });
  const buttonExitOpacity = holdProgress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.78, 0],
  });

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.ticketBackgroundLayer, { opacity: cloudFadeOpacity }]}>
        <ImageBackground
          source={onboardingCloudTicketBg}
          style={styles.screen}
          imageStyle={styles.ticketBackgroundImage as any}
          resizeMode="cover"
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.ticketArrivalPreviewLayer, { opacity: arrivalPreviewOpacity }]}
      >
        <Animated.Image
          source={destination.cardImage}
          style={[styles.arrivalVideo, { transform: [{ scale: arrivalPreviewScale }] }]}
          resizeMode={ResizeMode.COVER}
        />
        <View style={styles.ticketArrivalPreviewTint} />
      </Animated.View>
      <View style={[styles.statusRow, { top: y(20, height) }]}>
        <Text style={styles.statusText}>9:41</Text>
        <Text style={styles.statusText}>⌁ ◒ ▰</Text>
      </View>
      {showContent && (
        <>
          <Animated.View
            style={[
              styles.ticketForeground,
              { opacity: contentExitOpacity, transform: [{ translateY: contentExitTranslateY }] },
            ]}
          >
            <Animated.View
              style={[
                styles.ticketHeroCopy,
                {
                  left: x(28, width),
                  right: x(28, width),
                  top: y(312, height),
                  opacity: heroOpacity,
                  transform: [{ translateY: heroTranslateY }],
                },
              ]}
            >
              <SoftRevealInlineText
                text="Where shall we"
                textKey="ticket-hero-main"
                style={[styles.ticketHeroMain, { fontSize: s(29, width), lineHeight: s(35, width) }]}
                ghostStrength={0.18}
              />
              <SoftRevealInlineText
                text="breathe today"
                textKey="ticket-hero-serif"
                style={[
                  styles.ticketHeroSerif,
                  fontsLoaded && styles.ticketHeroSerifLoaded,
                  { fontSize: s(31, width), lineHeight: s(36, width) },
                ]}
                delay={120}
                ghostStrength={0.16}
              />
              <SoftRevealInlineText
                text="Begin a journey back to yourself"
                textKey="ticket-hero-sub"
                style={styles.ticketHeroSub}
                delay={240}
                ghostStrength={0.12}
              />
            </Animated.View>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ticketFogCurtain,
              {
                opacity: fogOpacity,
                transform: [{ translateY: fogTranslateY }, { scale: fogScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ticketStartButtonFrame,
              {
                left: 0,
                right: 0,
                top: y(506, height),
                opacity: buttonOpacity,
                transform: [{ translateY: buttonTranslateY }],
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.ticketStartGlow,
                {
                  opacity: startGlowOpacity,
                  transform: [{ scale: startGlowScale }],
                },
              ]}
            />
            <Animated.View pointerEvents="none" style={[styles.ticketHoldRing, { opacity: holdRingOpacity }]}>
              <Animated.View style={[styles.ticketHoldArc, { transform: [{ rotate: holdArcRotate }] }]} />
            </Animated.View>
            <Pressable
              {...(Platform.OS === 'web'
                ? ({
                    onMouseDown: startJourneyHold,
                    onMouseUp: cancelJourneyHold,
                    onMouseLeave: cancelJourneyHold,
                    onPointerDown: startJourneyHold,
                    onPointerUp: cancelJourneyHold,
                    onPointerCancel: cancelJourneyHold,
                    onPointerLeave: cancelJourneyHold,
                  } as any)
                : {})}
              {...(Platform.OS === 'web' ? ({ onClick: completeJourneyHold } as any) : {})}
              accessibilityRole="button"
              accessibilityLabel="Start Journey"
              onPress={completeJourneyHold}
              onPressIn={startJourneyHold}
              onPressOut={cancelJourneyHold}
              onLongPress={completeJourneyHold}
              delayLongPress={980}
              style={({ pressed }) => [styles.ticketStartButtonTouch, pressed && styles.springPress]}
            >
              <Animated.View
                style={[
                  styles.ticketStartButton,
                  {
                    opacity: buttonExitOpacity,
                    transform: [{ translateY: startCircleTranslateY }, { scale: startCircleScale }],
                  },
                ]}
              >
                <Animated.Text style={[styles.ticketStartArrow, { transform: [{ translateY: startArrowTranslateY }] }]}>
                  ⌃
                </Animated.Text>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );
}

function BoardingScreen({
  width,
  height,
  onStart,
}: {
  width: number;
  height: number;
  onStart: () => void;
}) {
  return (
    <LinearGradient colors={['#EFF6FA', '#F8F8F2', '#ECF1ED']} style={styles.screen}>
      <View style={[styles.statusRow, { top: y(20, height) }]}>
        <Text style={styles.statusText}>9:41</Text>
        <Text style={styles.statusText}>⌁ ◒ ▰</Text>
      </View>
      <View style={styles.leafCluster}>
        <View style={styles.leafOne} />
        <View style={styles.leafTwo} />
        <View style={styles.leafThree} />
      </View>

      <View style={[styles.copyBlock, { left: x(42, width), right: x(42, width), top: y(166, height) }]}>
        <Text style={[styles.heroDark, { fontSize: s(28, width) }]}>Where shall we{'\n'}breathe today?</Text>
        <Text style={styles.bodyDark}>Begin a 30-second journey back to yourself.</Text>
      </View>

      <View style={[styles.ticketCard, { left: x(40, width), right: x(40, width), top: y(406, height) }]}>
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketLabel}>YOUR JOURNEY</Text>
          <Text style={styles.ticketPlane}>✈</Text>
        </View>
        <View style={styles.ticketRow}>
          <Text style={styles.ticketSmall}>From</Text>
          <Text style={styles.ticketValue}>Anywhere</Text>
        </View>
        <View style={styles.ticketRoute} />
        <View style={styles.ticketRow}>
          <Text style={styles.ticketSmall}>To</Text>
          <Text style={styles.ticketValue}>A calmer you</Text>
        </View>
      </View>

      <View style={[styles.bottomAction, { left: x(40, width), right: x(40, width), bottom: y(70, height) }]}>
        <Pressable onPress={onStart} style={({ pressed }) => [styles.greenButton, pressed && styles.springPress]}>
          <Text style={styles.greenButtonText}>Start journey</Text>
        </Pressable>
        <Pressable onPress={onStart} style={({ pressed }) => [styles.textButton, pressed && styles.springPress]}>
          <Text style={styles.textButtonText}>I'll do this later</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function ArrivalSessionScreen({
  width,
  height,
  destination,
  selectedSession,
  routineReminder,
  recordCount,
  onSelectDestination,
  onContinue,
  onBack,
  onOpenRoutine,
  onOpenRecords,
}: {
  width: number;
  height: number;
  destination: Destination;
  selectedSession: Session;
  routineReminder: RoutineReminder | null;
  recordCount: number;
  onSelectDestination: (destination: Destination) => void;
  onContinue: () => void;
  onBack: () => void;
  onOpenRoutine: () => void;
  onOpenRecords: () => void;
}) {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_400Regular });
  const selectedIndex = destinations.findIndex((item) => item.id === destination.id);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const nextDestination = destinations[(safeIndex + 1) % destinations.length];
  const previousDestination = destinations[(safeIndex - 1 + destinations.length) % destinations.length];
  const revealMist = useRef(new Animated.Value(0)).current;
  const dialSpin = useRef(new Animated.Value(0)).current;
  const backgroundFade = useRef(new Animated.Value(1)).current;
  const isDialSpinning = useRef(false);
  const lastBackgroundDestinationId = useRef(destination.id);
  const [activeBackgroundImage, setActiveBackgroundImage] = useState(destination.cardImage);
  const [outgoingBackgroundImage, setOutgoingBackgroundImage] = useState<ImageSourcePropType | null>(null);
  const spinToDestination = useCallback(
    (nextItem: Destination, direction: 1 | -1) => {
      if (nextItem.id === destination.id || isDialSpinning.current) {
        return;
      }

      isDialSpinning.current = true;
      Animated.timing(dialSpin, {
        toValue: direction,
        duration: 210,
        easing: Easing.bezier(0.2, 0.9, 0.22, 1),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onSelectDestination(nextItem);
          dialSpin.setValue(-direction * 0.72);
          Animated.spring(dialSpin, {
            toValue: 0,
            tension: 62,
            friction: 7,
            useNativeDriver: true,
          }).start(() => {
            isDialSpinning.current = false;
          });
          return;
        }

        dialSpin.setValue(0);
        isDialSpinning.current = false;
      });
    },
    [destination.id, dialSpin, onSelectDestination],
  );
  const globePanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -30) {
            spinToDestination(nextDestination, 1);
          }
          if (gesture.dx >= 30) {
            spinToDestination(previousDestination, -1);
          }
        },
      }),
    [nextDestination, previousDestination, spinToDestination],
  );

  useEffect(() => {
    revealMist.setValue(0);
    Animated.timing(revealMist, {
      toValue: 1,
      duration: 980,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [revealMist]);

  useEffect(() => {
    if (lastBackgroundDestinationId.current === destination.id) {
      return;
    }

    setOutgoingBackgroundImage(activeBackgroundImage);
    setActiveBackgroundImage(destination.cardImage);
    lastBackgroundDestinationId.current = destination.id;
    backgroundFade.stopAnimation();
    backgroundFade.setValue(0);
    Animated.timing(backgroundFade, {
      toValue: 1,
      duration: 540,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setOutgoingBackgroundImage(null);
    });
  }, [activeBackgroundImage, backgroundFade, destination.cardImage, destination.id]);

  const revealMistOpacity = revealMist.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0.96, 0.7, 0],
  });
  const revealMistTranslateY = revealMist.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, -280],
  });
  const revealMistScale = revealMist.interpolate({
    inputRange: [0, 1],
    outputRange: [2.8, 3.8],
  });
  const revealVideoScale = revealMist.interpolate({
    inputRange: [0, 1],
    outputRange: [1.1, 1],
  });
  const backgroundImageScale = backgroundFade.interpolate({
    inputRange: [0, 1],
    outputRange: [1.045, 1],
  });
  const outgoingBackgroundOpacity = backgroundFade.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const revealContentOpacity = revealMist.interpolate({
    inputRange: [0, 0.42, 1],
    outputRange: [0, 0.35, 1],
  });
  const revealContentTranslateY = revealMist.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });
  const dialTranslateX = dialSpin.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [68, 0, -68],
  });
  const dialRotate = dialSpin.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['7deg', '0deg', '-7deg'],
  });
  const dialScale = dialSpin.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.965, 1, 0.965],
  });

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.arrivalVideoLayer, { transform: [{ scale: revealVideoScale }] }]}>
        {outgoingBackgroundImage ? (
          <Animated.Image
            source={outgoingBackgroundImage}
            style={[styles.arrivalVideo, { opacity: outgoingBackgroundOpacity }]}
            resizeMode="cover"
          />
        ) : null}
        <Animated.Image
          source={activeBackgroundImage}
          style={[styles.arrivalVideo, { opacity: backgroundFade, transform: [{ scale: backgroundImageScale }] }]}
          resizeMode="cover"
        />
      </Animated.View>
      <View style={styles.arrivalVideoTint} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.arrivalRevealMist,
          {
            opacity: revealMistOpacity,
            transform: [{ translateY: revealMistTranslateY }, { scale: revealMistScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.arrivalUiLayer,
          {
            opacity: revealContentOpacity,
            transform: [{ translateY: revealContentTranslateY }],
          },
        ]}
      >
        <View style={[styles.statusRowLight, { top: y(20, height) }]}>
          <Text style={styles.statusTextLight}>9:41</Text>
          <Text style={styles.statusTextLight}>⌁ ◒ ▰</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to ticket"
          onPress={onBack}
          style={({ pressed }) => [styles.arrivalBackButton, { left: x(22, width), top: y(72, height) }, pressed && styles.springPress]}
        >
          <Text style={styles.arrivalBackText}>‹</Text>
        </Pressable>
        <View style={[styles.arrivalTopActions, { right: x(22, width), top: y(72, height) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open journal"
            onPress={onOpenRecords}
            style={({ pressed }) => [styles.arrivalActionButton, pressed && styles.springPress]}
          >
            <Text style={styles.arrivalActionText}>Journal</Text>
            {recordCount > 0 && <Text style={styles.arrivalActionMeta}>{recordCount}</Text>}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open routine"
            onPress={onOpenRoutine}
            style={({ pressed }) => [styles.arrivalActionButton, pressed && styles.springPress]}
          >
            <Text style={styles.arrivalActionText}>Routine</Text>
            {routineReminder && <Text style={styles.arrivalActionMeta}>{formatRoutineTime(routineReminder)}</Text>}
          </Pressable>
        </View>

        <View style={[styles.arrivalPrompt, { left: x(26, width), right: x(26, width), top: y(154, height) }]}>
          <Text style={styles.arrivalPromptText}>Choose your air</Text>
          <View style={styles.arrivalPromptRule} />
        </View>

        <View style={[styles.arrivalCopy, { left: x(20, width), right: x(20, width), top: y(294, height) }]}>
          <SoftRevealInlineText
            text={destination.title}
            textKey={`arrival-title-${destination.id}`}
            style={[
              styles.arrivalTitle,
              fontsLoaded && styles.placeSerifLoaded,
              { fontSize: s(30, width), lineHeight: s(36, width) },
            ]}
          />
        </View>

        <View
          style={[styles.airGlobeDock, { left: 0, right: 0, bottom: y(46, height) }]}
          {...globePanResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.airDialMotion,
              {
                transform: [{ translateX: dialTranslateX }, { rotate: dialRotate }, { scale: dialScale }],
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Previous air ${previousDestination.title}`}
              onPress={() => spinToDestination(previousDestination, -1)}
              style={({ pressed }) => [styles.airDialPeek, styles.airDialPeekLeft, pressed && styles.springPress]}
            >
              <DestinationPreviewMedia
                destination={previousDestination}
                style={styles.airDialPeekImage}
                shouldPlay={false}
                fit="contain"
              />
              <View style={styles.airDialPeekShade} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Next air ${nextDestination.title}`}
              onPress={() => spinToDestination(nextDestination, 1)}
              style={({ pressed }) => [styles.airDialPeek, styles.airDialPeekRight, pressed && styles.springPress]}
            >
              <DestinationPreviewMedia
                destination={nextDestination}
                style={styles.airDialPeekImage}
                shouldPlay={false}
                fit="contain"
              />
              <View style={styles.airDialPeekShade} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose ${destination.title}`}
              onPress={onContinue}
              style={({ pressed }) => [styles.airDialCard, pressed && styles.springPress]}
              {...globePanResponder.panHandlers}
            >
              <DestinationPreviewMedia destination={destination} style={styles.airDialCardImage} shouldPlay />
              <LinearGradient
                colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.18)', 'rgba(0, 0, 0, 0.66)']}
                locations={[0, 0.48, 1]}
                style={styles.airDialCardScrim}
              />
              <View style={styles.airDialCardContent}>
                <SoftRevealInlineText
                  text={destination.country}
                  textKey={`air-card-country-${destination.id}`}
                  style={[styles.airDialCardTitle, fontsLoaded && styles.placeSerifLoaded]}
                />
                <SoftRevealInlineText
                  text={destination.title}
                  textKey={`air-card-title-${destination.id}`}
                  style={styles.airDialCardSubtitle}
                  delay={80}
                />
              </View>
            </Pressable>
          </Animated.View>
          <View pointerEvents="none" style={styles.airDialRail}>
            <View style={styles.airDialRailThumb} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function DestinationGlobeScreen({
  width,
  height,
  destination,
  onSelectDestination,
  onContinue,
  onBack,
}: {
  width: number;
  height: number;
  destination: Destination;
  onSelectDestination: (destination: Destination) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const selectedIndex = destinations.findIndex((item) => item.id === destination.id);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const background = destination.palette.background;
  const nextDestination = useCallback(() => {
    onSelectDestination(destinations[(safeIndex + 1) % destinations.length]);
  }, [onSelectDestination, safeIndex]);
  const previousDestination = useCallback(() => {
    onSelectDestination(destinations[(safeIndex - 1 + destinations.length) % destinations.length]);
  }, [onSelectDestination, safeIndex]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -44) {
            nextDestination();
          }
          if (gesture.dx >= 44) {
            previousDestination();
          }
        },
      }),
    [nextDestination, previousDestination],
  );

  return (
    <LinearGradient colors={background} style={styles.screen}>
      <View style={[styles.destinationSoftLight, { backgroundColor: destination.palette.glow }]} />
      <View style={[styles.statusRow, { top: y(20, height) }]}>
        <Text style={styles.statusText}>9:41</Text>
        <Text style={styles.statusText}>⌁ ◒ ▰</Text>
      </View>
      <View style={[styles.destinationTopBar, { top: y(70, height), left: x(22, width), right: x(22, width) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          style={({ pressed }) => [styles.destinationIconButton, pressed && styles.springPress]}
        >
          <Text style={styles.destinationIconText}>‹</Text>
        </Pressable>
        <Text style={styles.destinationCounter}>{safeIndex + 1} / {destinations.length}</Text>
      </View>

      <View style={[styles.destinationCopy, { left: x(28, width), right: x(28, width), top: y(122, height) }]}>
        <Text style={styles.destinationEyebrow}>DESTINATION</Text>
        <Text style={[styles.destinationTitle, { fontSize: s(33, width), lineHeight: s(38, width) }]}>
          Choose your breathing country
        </Text>
      </View>

      <View
        style={[styles.destinationGlobeStage, { top: y(254, height), height: y(344, height) }]}
        {...panResponder.panHandlers}
      >
        <ThreeGlobePreview destination={destination} width={width} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous destination"
          onPress={previousDestination}
          style={({ pressed }) => [styles.destinationArrow, styles.destinationArrowLeft, pressed && styles.springPress]}
        >
          <Text style={styles.destinationArrowText}>‹</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next destination"
          onPress={nextDestination}
          style={({ pressed }) => [styles.destinationArrow, styles.destinationArrowRight, pressed && styles.springPress]}
        >
          <Text style={styles.destinationArrowText}>›</Text>
        </Pressable>
      </View>

      <View style={[styles.destinationHint, { top: y(600, height) }]}>
        <Text style={styles.destinationHintText}>Swipe globe to preview</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.destinationPillRow}
        style={[styles.destinationPillScroll, { bottom: y(198, height) }]}
      >
        {destinations.map((item) => {
          const active = item.id === destination.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectDestination(item)}
              style={({ pressed }) => [
                styles.destinationPill,
                active && { backgroundColor: item.palette.accent, borderColor: item.palette.accent },
                pressed && styles.springPress,
              ]}
            >
              <Text style={[styles.destinationPillText, active && styles.destinationPillTextActive]}>{item.country}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.destinationPanel, { left: x(22, width), right: x(22, width), bottom: y(24, height), backgroundColor: destination.palette.panel }]}>
        <View style={styles.destinationPanelHeader}>
          <View>
            <Text style={styles.destinationCountry}>{destination.country}</Text>
            <Text style={styles.destinationName}>{destination.title}</Text>
          </View>
          <View style={[styles.destinationMiniOrb, { backgroundColor: destination.palette.accent, shadowColor: destination.palette.glow }]} />
        </View>
        <Text style={styles.destinationMood}>{destination.mood}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue"
          onPress={onContinue}
          style={({ pressed }) => [
            styles.destinationContinueButton,
            { backgroundColor: destination.palette.accent },
            pressed && styles.springPress,
          ]}
        >
          <Text style={styles.destinationContinueText}>Continue</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

function ThreeGlobePreview({ destination, width }: { destination: Destination; width: number }) {
  const mountRef = useRef<HTMLElement | null>(null);
  const size = Math.min(s(306, width), 320);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined' || !mountRef.current) {
      return;
    }

    let animationFrame = 0;
    let disposed = false;
    let rendererRef: { dispose: () => void; domElement: HTMLCanvasElement } | null = null;

    const buildTexture = (THREE: typeof import('three')) => {
      const canvas = document.createElement('canvas');
      canvas.width = 768;
      canvas.height = 768;
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      const gradient = context.createRadialGradient(250, 168, 34, 384, 384, 560);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(0.28, destination.palette.glow);
      gradient.addColorStop(0.66, destination.palette.background[1]);
      gradient.addColorStop(1, destination.palette.ocean);
      context.fillStyle = gradient;
      context.fillRect(0, 0, 768, 768);

      const seed = destination.id.length * 19;
      context.globalAlpha = 0.18;
      context.fillStyle = destination.palette.land;
      for (let index = 0; index < 9; index += 1) {
        const cx = (seed * (index + 3) * 41) % 768;
        const cy = (seed * (index + 5) * 31) % 768;
        const rx = 62 + ((seed + index * 29) % 116);
        const ry = 24 + ((seed + index * 19) % 68);
        context.beginPath();
        context.ellipse(cx, cy, rx, ry, (index * Math.PI) / 7, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 0.32;
      context.fillStyle = '#FFFFFF';
      for (let cloud = 0; cloud < 22; cloud += 1) {
        const cx = (seed * (cloud + 7) * 17) % 768;
        const cy = (seed * (cloud + 11) * 13) % 768;
        const rx = 54 + ((cloud * 23) % 132);
        const ry = 12 + ((cloud * 11) % 36);
        context.beginPath();
        context.ellipse(cx, cy, rx, ry, (cloud * Math.PI) / 11, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 0.28;
      context.strokeStyle = '#FFFFFF';
      context.lineWidth = 1.5;
      for (let line = 0; line < 8; line += 1) {
        context.beginPath();
        context.moveTo(0, 102 + line * 78);
        context.bezierCurveTo(190, 52 + line * 82, 470, 156 + line * 56, 768, 102 + line * 78);
        context.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const buildCloudTexture = (THREE: typeof import('three')) => {
      const canvas = document.createElement('canvas');
      canvas.width = 768;
      canvas.height = 768;
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.clearRect(0, 0, 768, 768);
      context.fillStyle = '#FFFFFF';
      context.strokeStyle = '#FFFFFF';
      const seed = destination.country.length * 23;

      for (let cloud = 0; cloud < 34; cloud += 1) {
        const cx = (seed * (cloud + 4) * 19) % 768;
        const cy = (seed * (cloud + 9) * 17) % 768;
        const rx = 42 + ((seed + cloud * 13) % 124);
        const ry = 10 + ((seed + cloud * 7) % 32);
        context.globalAlpha = 0.10 + (cloud % 4) * 0.04;
        context.beginPath();
        context.ellipse(cx, cy, rx, ry, (cloud * Math.PI) / 9, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 0.16;
      context.lineWidth = 1.2;
      for (let line = 0; line < 9; line += 1) {
        context.beginPath();
        context.moveTo(-20, 86 + line * 74);
        context.bezierCurveTo(170, 44 + line * 68, 440, 134 + line * 54, 788, 72 + line * 78);
        context.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    };

    const start = async () => {
      const THREE = await import('three');
      if (disposed || !mountRef.current) {
        return;
      }

      const mount = mountRef.current;
      while (mount.firstChild) {
        mount.removeChild(mount.firstChild);
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 4.8);

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      rendererRef = renderer;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(size, size);
      mount.appendChild(renderer.domElement);

      const texture = buildTexture(THREE);
      const cloudTexture = buildCloudTexture(THREE);
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(1.42, 64, 64),
        new THREE.MeshPhysicalMaterial({
          color: '#F8FCFC',
          map: texture ?? undefined,
          transparent: true,
          opacity: 0.92,
          roughness: 0.42,
          metalness: 0.02,
          clearcoat: 0.72,
          clearcoatRoughness: 0.36,
          emissive: destination.palette.glow,
          emissiveIntensity: 0.16,
        }),
      );
      globe.rotation.set(-0.16, -0.48, 0.08);
      scene.add(globe);

      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.455, 64, 64),
        new THREE.MeshBasicMaterial({
          map: cloudTexture ?? undefined,
          color: '#FFFFFF',
          transparent: true,
          opacity: 0.46,
          depthWrite: false,
        }),
      );
      clouds.rotation.set(-0.12, -0.38, 0.12);
      scene.add(clouds);

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.62, 64, 64),
        new THREE.MeshBasicMaterial({
          color: destination.palette.glow,
          transparent: true,
          opacity: 0.32,
          side: THREE.BackSide,
        }),
      );
      scene.add(atmosphere);

      const keyLight = new THREE.DirectionalLight('#FFFFFF', 2.9);
      keyLight.position.set(2.5, 3.8, 4.6);
      scene.add(keyLight);
      const fillLight = new THREE.DirectionalLight(destination.palette.glow, 1.4);
      fillLight.position.set(-3.4, -1.6, 3.2);
      scene.add(fillLight);
      scene.add(new THREE.AmbientLight('#FFFFFF', 1.25));

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 16),
        new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.92 }),
      );
      marker.position.set(0.62, 0.7, 1.23);
      globe.add(marker);

      const animate = () => {
        if (disposed) {
          return;
        }
        globe.rotation.y += 0.0038;
        clouds.rotation.y += 0.0048;
        atmosphere.rotation.y -= 0.0016;
        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
      };

      animate();
    };

    start();

    return () => {
      disposed = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      if (rendererRef?.domElement.parentNode) {
        rendererRef.domElement.parentNode.removeChild(rendererRef.domElement);
      }
      rendererRef?.dispose();
    };
  }, [destination, size]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.destinationFallbackGlobe, { width: size, height: size, borderRadius: size / 2, backgroundColor: destination.palette.ocean }]}>
        <View style={[styles.destinationFallbackGlow, { backgroundColor: destination.palette.glow }]} />
        <View style={[styles.destinationFallbackLand, { backgroundColor: destination.palette.land }]} />
      </View>
    );
  }

  return (
    <View
      ref={mountRef as any}
      style={[styles.destinationThreeMount, { width: size, height: size }]}
    />
  );
}

function SessionMapScreen({
  width,
  height,
  selectedSession,
  weekCheckIns,
  onSelectSession,
  onStart,
  onOpenRecords,
}: {
  width: number;
  height: number;
  selectedSession: Session;
  weekCheckIns: WeekCheckInDay[];
  onSelectSession: (session: Session) => void;
  onStart: () => void;
  onOpenRecords: () => void;
}) {
  const planeX = useRef(new Animated.Value(x(selectedSession.mapX, width))).current;
  const planeY = useRef(new Animated.Value(y(selectedSession.mapY, height))).current;
  const planeRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(planeX, {
        toValue: x(selectedSession.mapX - 34, width),
        friction: 7,
        tension: 72,
        useNativeDriver: false,
      }),
      Animated.spring(planeY, {
        toValue: y(selectedSession.mapY - 26, height),
        friction: 7,
        tension: 72,
        useNativeDriver: false,
      }),
      Animated.spring(planeRotation, {
        toValue: selectedSession.id === 'iceland-water' ? -1 : selectedSession.id === 'finland-night' ? 1 : 0.2,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [height, planeRotation, planeX, planeY, selectedSession, width]);

  const planeRotate = planeRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-22deg', '24deg'],
  });

  return (
    <LinearGradient colors={['#F5F9F8', '#EAF2F4', '#F8F6F0']} style={styles.screen}>
      <View style={[styles.statusRow, { top: y(20, height) }]}>
        <Text style={styles.statusText}>9:41</Text>
        <Text style={styles.statusText}>⌁ ◒ ▰</Text>
      </View>
      <View style={[styles.mapMenu, { left: x(26, width), top: y(72, height) }]}>
        <Text style={styles.mapMenuText}>☰</Text>
      </View>
      <View style={[styles.profileDot, { right: x(25, width), top: y(72, height) }]}>
        <Text style={styles.profileDotText}>◉</Text>
      </View>
      <WeeklyCheckIn
        title="This week"
        weekCheckIns={weekCheckIns}
        style={[styles.mapWeeklyCheckIn, { left: x(105, width), right: x(105, width), top: y(74, height) }]}
      />

      <View style={styles.mapTexture}>
        <View style={[styles.mapCloud, { left: x(-22, width), top: y(122, height) }]} />
        <View style={[styles.mapCloudSmall, { right: x(-34, width), top: y(432, height) }]} />
        <View style={[styles.mapIsland, { left: x(44, width), top: y(332, height), transform: [{ rotate: '-18deg' }] }]} />
        <View style={[styles.mapIsland, { right: x(40, width), top: y(246, height), transform: [{ rotate: '18deg' }] }]} />
        <View style={[styles.routeLine, { left: x(84, width), top: y(442, height), width: x(206, width), transform: [{ rotate: '-28deg' }] }]} />
        <View style={[styles.routeLine, { left: x(150, width), top: y(510, height), width: x(178, width), transform: [{ rotate: '30deg' }] }]} />
      </View>

      <Animated.View style={[styles.mapPlane, { left: planeX, top: planeY, transform: [{ rotate: planeRotate }] }]}>
        <Text style={styles.mapPlaneText}>✈</Text>
      </Animated.View>

      {sessions.map((session) => (
        <MapPin
          key={session.id}
          width={width}
          height={height}
          session={session}
          active={selectedSession.id === session.id}
          onPress={() => onSelectSession(session)}
        />
      ))}

      <SessionMapCard
        width={width}
        height={height}
        session={sessions[0]}
        active={selectedSession.id === sessions[0].id}
        left={x(250, width)}
        top={y(132, height)}
        onPress={() => onSelectSession(sessions[0])}
      />
      <SessionMapCard
        width={width}
        height={height}
        session={sessions[1]}
        active={selectedSession.id === sessions[1].id}
        left={x(28, width)}
        top={y(496, height)}
        onPress={() => onSelectSession(sessions[1])}
      />
      <SessionMapCard
        width={width}
        height={height}
        session={sessions[2]}
        active={selectedSession.id === sessions[2].id}
        left={x(206, width)}
        top={y(592, height)}
        onPress={() => onSelectSession(sessions[2])}
      />

      <View style={[styles.mapBottomNav, { left: x(62, width), right: x(62, width), bottom: y(22, height) }]}>
        <View style={styles.navItemActive}>
          <Text style={styles.navIcon}>◎</Text>
          <Text style={styles.navTextActive}>Sessions</Text>
        </View>
        <Pressable onPress={onOpenRecords} style={({ pressed }) => [styles.navItem, pressed && styles.springPress]}>
          <Text style={styles.navIcon}>□</Text>
          <Text style={styles.navText}>Journal</Text>
        </Pressable>
        <View style={styles.navItem}>
          <Text style={styles.navIcon}>♙</Text>
          <Text style={styles.navText}>Profile</Text>
        </View>
      </View>

      <Pressable onPress={onStart} style={({ pressed }) => [styles.floatingStart, pressed && styles.springPress]}>
        <Text style={styles.floatingStartText}>Start</Text>
      </Pressable>
    </LinearGradient>
  );
}

function MapPin({
  width,
  height,
  session,
  active,
  onPress,
}: {
  width: number;
  height: number;
  session: Session;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.mapPin,
        {
          left: x(session.mapX, width),
          top: y(session.mapY, height),
          transform: [{ scale: active ? 1.12 : 1 }],
        },
      ]}
    >
      <View style={[styles.pinDot, active && styles.pinDotActive]} />
    </Pressable>
  );
}

function DestinationPreviewMedia({
  destination,
  style,
  shouldPlay,
  fit = 'cover',
}: {
  destination: Destination;
  style: StyleProp<ViewStyle>;
  shouldPlay: boolean;
  fit?: 'cover' | 'contain';
}) {
  if (destination.previewVideo) {
    return (
      <Video
        source={destination.previewVideo}
        style={style}
        resizeMode={fit === 'contain' ? ResizeMode.CONTAIN : ResizeMode.COVER}
        shouldPlay={shouldPlay}
        isLooping
        isMuted
      />
    );
  }

  return <Image source={destination.cardImage} style={style as any} resizeMode={fit} />;
}

function SessionMapCard({
  width,
  height,
  session,
  active,
  left,
  top,
  onPress,
}: {
  width: number;
  height: number;
  session: Session;
  active: boolean;
  left: number;
  top: number;
  onPress: () => void;
}) {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_400Regular });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.mapCard,
        {
          left,
          top,
          width: x(132, width),
          minHeight: y(106, height),
          transform: [{ scale: active ? 1.045 : 1 }],
          opacity: active ? 1 : 0.88,
        },
        pressed && styles.springPress,
      ]}
    >
      <View style={styles.mapCardThumb}>
        <Video
          source={session.video}
          style={styles.mapCardThumbVideo}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={active}
          isLooping
          isMuted
        />
        {!active && <LinearGradient colors={['rgba(12,18,22,0.12)', 'rgba(12,18,22,0.38)']} style={StyleSheet.absoluteFill} />}
      </View>
      <View style={styles.mapCardCopy}>
        <Text style={[styles.mapCardTitle, fontsLoaded && styles.placeSerifLoaded]}>{session.destination}</Text>
        <Text style={styles.mapCardDesc}>{session.title}</Text>
      </View>
      <View style={styles.mapCardPlay}>
        <Text style={styles.mapCardPlayText}>›</Text>
      </View>
    </Pressable>
  );
}

function PrepareScreen({
  width,
  height,
  session,
  destination,
  onBack,
  onStart,
}: {
  width: number;
  height: number;
  session: Session;
  destination: Destination;
  onBack: () => void;
  onStart: () => void;
}) {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_400Regular });

  return (
    <ImageBackground
      source={destination.cardImage}
      style={styles.screen}
      imageStyle={styles.prepareBackgroundImage as any}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(8, 13, 16, 0.18)', 'rgba(8, 13, 16, 0.28)', 'rgba(8, 13, 16, 0.78)']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.prepareVignette} />
      <View style={[styles.statusRowLight, { top: y(20, height) }]}>
        <Text style={styles.statusTextLight}>9:41</Text>
        <Text style={styles.statusTextLight}>⌁ ◒ ▰</Text>
      </View>
      <Pressable onPress={onBack} style={[styles.prepareBack, { left: x(20, width), top: y(72, height) }]}>
        <Text style={styles.prepareBackText}>‹</Text>
      </Pressable>
      <Pressable onPress={onBack} style={[styles.prepareClose, { right: x(20, width), top: y(72, height) }]}>
        <Text style={styles.prepareBackText}>×</Text>
      </Pressable>

      <View style={[styles.prepareHeader, { left: x(28, width), right: x(28, width), top: y(188, height) }]}>
        <SoftRevealInlineText
          text={destination.title}
          textKey={`prepare-air-${destination.id}`}
          style={[
            styles.prepareDestination,
            fontsLoaded && styles.placeSerifLoaded,
            { fontSize: s(30, width), lineHeight: s(36, width) },
          ]}
          ghostStrength={0.18}
        />
      </View>

      <View style={[styles.prepareMetricStack, { left: x(22, width), right: x(22, width), top: y(392, height) }]}>
        <PrepareMetric label="Time" value={`${session.durationMinutes} min`} />
        <PrepareMetric label="Rhythm" value={session.rhythm} />
        <PrepareMetric label="Sound" value={toDefaultSoundLabel(session.sound)} />
        <PrepareMetric label="Focus" value={session.focus} />
      </View>

      <View style={[styles.bottomAction, { left: x(22, width), right: x(22, width), bottom: y(44, height) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Begin breathing"
          onPress={onStart}
          style={({ pressed }) => [styles.prepareBeginButton, pressed && styles.springPress]}
        >
          <Text style={styles.prepareBeginText}>Begin breathing</Text>
          <Text style={styles.prepareBeginArrow}>↑</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change air"
          onPress={onBack}
          style={({ pressed }) => [styles.textButton, pressed && styles.springPress]}
        >
          <Text style={styles.prepareChangeText}>Change air</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

function PrepareMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.prepareMetric}>
      <Text style={styles.prepareMetricLabel}>{label}</Text>
      <Text style={styles.prepareMetricValue}>{value}</Text>
    </View>
  );
}

function SoftRevealText({
  text,
  textKey,
  style,
  delay = 0,
}: {
  text: string;
  textKey: string | number;
  style: StyleProp<TextStyle>;
  delay?: number;
}) {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.stopAnimation();
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: 980,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, reveal, textKey]);

  const ghostOpacity = reveal.interpolate({
    inputRange: [0, 0.46, 1],
    outputRange: [0, 0.42, 0],
  });
  const mainOpacity = reveal.interpolate({
    inputRange: [0, 0.36, 1],
    outputRange: [0, 0.34, 1],
  });
  const translateY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const ghostScale = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [1.02, 1.08],
  });

  return (
    <>
      <Animated.Text
        pointerEvents="none"
        style={[
          style,
          styles.softRevealGhostText,
          {
            opacity: ghostOpacity,
            transform: [{ translateY }, { scale: ghostScale }],
          },
        ]}
      >
        {text}
      </Animated.Text>
      <Animated.Text style={[style, { opacity: mainOpacity, transform: [{ translateY }] }]}>{text}</Animated.Text>
    </>
  );
}

function SoftRevealInlineText({
  text,
  textKey,
  style,
  delay = 0,
  ghostStrength = 0.62,
}: {
  text: string;
  textKey: string | number;
  style: StyleProp<TextStyle>;
  delay?: number;
  ghostStrength?: number;
}) {
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.stopAnimation();
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: 1320,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, reveal, textKey]);

  const ghostOpacity = reveal.interpolate({
    inputRange: [0, 0.2, 0.68, 1],
    outputRange: [0, ghostStrength, ghostStrength * 0.45, 0],
  });
  const mainOpacity = reveal.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0, 0.18, 1],
  });
  const translateY = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });
  const ghostScale = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [1.02, 1.1],
  });

  return (
    <View style={styles.softRevealInline}>
      <Animated.Text
        pointerEvents="none"
        style={[style, styles.softRevealInlineGhost, { opacity: ghostOpacity, transform: [{ translateY }, { scale: ghostScale }] }]}
      >
        {text}
      </Animated.Text>
      <Animated.Text style={[style, { opacity: mainOpacity, transform: [{ translateY }] }]}>{text}</Animated.Text>
    </View>
  );
}

function BreathingScreen({
  width,
  height,
  session,
  onCancel,
  onComplete,
}: {
  width: number;
  height: number;
  session: Session;
  onCancel: () => void;
  onComplete: () => void;
}) {
  const phases = useMemo(() => getBreathPhases(session.rhythm), [session.rhythm]);
  const totalSeconds = session.durationMinutes * 60;
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(phases[0].seconds);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(Math.min(24, totalSeconds));
  const [introCountdown, setIntroCountdown] = useState<number | null>(3);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const videoRef = useRef<Video>(null);
  const phaseIndexRef = useRef(0);
  const circleScale = useRef(new Animated.Value(0.74)).current;
  const glowOpacity = useRef(new Animated.Value(0.18)).current;

  const phase = phases[phaseIndex] ?? phases[0];
  const complete = totalSecondsLeft <= 0;

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(() => {
      // Audio mode support differs across Expo targets; playback can still proceed with defaults.
    });
  }, []);

  const handleSoundToggle = () => {
    setIsSoundEnabled((enabled) => !enabled);
  };

  useEffect(() => {
    phaseIndexRef.current = 0;
    setPhaseIndex(0);
    setPhaseSecondsLeft(phases[0].seconds);
    setTotalSecondsLeft(Math.min(24, totalSeconds));
    setIntroCountdown(3);
    setIsSoundEnabled(true);
  }, [phases, session.id, totalSeconds]);

  useEffect(() => {
    if (complete) {
      onComplete();
    }
  }, [complete, onComplete]);

  useEffect(() => {
    if (complete || introCountdown !== null) {
      circleScale.stopAnimation();
      return;
    }

    Animated.parallel([
      Animated.timing(circleScale, {
        toValue: phase.scale,
        duration: phase.seconds * 1000,
        easing: Easing.bezier(0.37, 0, 0.23, 1),
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: phase.label === 'Inhale' ? 0.28 : 0.1,
        duration: phase.seconds * 1000,
        easing: Easing.bezier(0.37, 0, 0.23, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [circleScale, complete, glowOpacity, introCountdown, phase.label, phase.scale, phase.seconds]);

  useEffect(() => {
    if (complete || introCountdown === null) {
      return;
    }

    const countdownTimer = setTimeout(() => {
      setIntroCountdown((current) => {
        if (current === null) {
          return null;
        }

        return current > 1 ? current - 1 : null;
      });
    }, 1000);

    return () => clearTimeout(countdownTimer);
  }, [complete, introCountdown]);

  useEffect(() => {
    if (complete || introCountdown !== null) {
      return;
    }

    const timer = setInterval(() => {
      setTotalSecondsLeft((current) => Math.max(0, current - 1));
      setPhaseSecondsLeft((current) => {
        if (current > 1) {
          return current - 1;
        }

        const nextPhaseIndex = (phaseIndexRef.current + 1) % phases.length;
        phaseIndexRef.current = nextPhaseIndex;
        setPhaseIndex(nextPhaseIndex);
        return phases[nextPhaseIndex].seconds;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [complete, introCountdown, phases]);

  const isCountingDown = introCountdown !== null;
  const timerLabel = String(isCountingDown ? introCountdown : phaseSecondsLeft);
  const phaseLabel = isCountingDown ? '' : phase.label;
  const guidanceLabel = isCountingDown ? '' : phase.label === 'Inhale' ? 'Inhale' : 'Exhale';
  const rhythmLabel = isCountingDown ? '' : session.rhythm;
  const soundToggleLabel = getSoundToggleLabel(session.sound, isSoundEnabled);

  return (
    <View style={styles.screen}>
      <Video
        key={session.id}
        ref={videoRef}
        source={session.video}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay={!complete && !isCountingDown}
        isLooping
        isMuted={!isSoundEnabled}
        volume={0.72}
      />
      <LinearGradient
        colors={['rgba(8, 15, 18, 0.16)', 'rgba(8, 15, 18, 0.24)', 'rgba(8, 15, 18, 0.74)']}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.breathScrim} />
      <View style={[styles.statusRowLight, { top: y(20, height) }]}>
        <Text style={styles.statusTextLight}>9:41</Text>
        <Text style={styles.statusTextLight}>⌁ ◒ ▰</Text>
      </View>
      <Pressable onPress={onCancel} style={[styles.prepareBack, { left: x(20, width), top: y(72, height) }]}>
        <Text style={styles.prepareBackText}>×</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={soundToggleLabel}
        onPress={handleSoundToggle}
        style={[styles.musicButton, { right: x(20, width), top: y(72, height) }]}
      >
        <Text style={styles.musicButtonText}>{isSoundEnabled ? '♫' : '♪'}</Text>
        <Text style={styles.musicButtonLabel}>{soundToggleLabel}</Text>
      </Pressable>

      <SoftRevealText
        text={phaseLabel}
        textKey={`${isCountingDown ? 'countdown' : phaseIndex}-${phaseLabel}`}
        style={[styles.breathPhase, { top: y(176, height), fontSize: s(15, width) }]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.breathGlow,
          {
            left: x(73, width),
            top: y(296, height),
            width: s(244, width),
            height: s(244, width),
            borderRadius: s(122, width),
            opacity: glowOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.breathRing,
          {
            left: x(73, width),
            top: y(296, height),
            width: s(244, width),
            height: s(244, width),
            borderRadius: s(122, width),
            transform: [{ scale: circleScale }],
          },
        ]}
      >
        <Text style={[styles.breathTimer, { fontSize: s(isCountingDown ? 48 : 42, width) }]}>{timerLabel}</Text>
        <Text style={styles.breathRemain}>{isCountingDown ? '' : 'Sec'}</Text>
      </Animated.View>

      <SoftRevealText text={guidanceLabel} textKey={`goal-${session.id}-${guidanceLabel}`} style={[styles.exhaleLabel, { top: y(672, height) }]} delay={160} />
      <SoftRevealText
        text={rhythmLabel}
        textKey={`rhythm-${session.id}-${rhythmLabel}`}
        style={[styles.rhythmLabel, { top: y(718, height) }]}
        delay={260}
      />
      <Pressable onPress={onComplete} style={[styles.finishLink, { bottom: y(22, height) }]}>
        <Text style={styles.finishLinkText}>Arrive now</Text>
      </Pressable>
    </View>
  );
}

function CompleteScreen({
  width,
  height,
  session,
  destination,
  weekCheckIns,
  weeklyRecordSummary,
  routineReminder,
  onRestart,
  onChooseAnother,
  onCreateRoutine,
}: {
  width: number;
  height: number;
  session: Session;
  destination: Destination;
  weekCheckIns: WeekCheckInDay[];
  weeklyRecordSummary: { completedCount: number; totalDurationSeconds: number };
  routineReminder: RoutineReminder | null;
  onRestart: () => void;
  onChooseAnother: () => void;
  onCreateRoutine: () => void;
}) {
  const routineText = routineReminder
    ? `Daily reminder is set for ${formatRoutineTime(routineReminder)}.`
    : 'Want a short breathing pause tomorrow?';

  return (
    <ImageBackground
      source={destination.cardImage}
      style={styles.screen}
      imageStyle={styles.completeBackgroundImage as any}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(9, 14, 15, 0.16)', 'rgba(9, 14, 15, 0.34)', 'rgba(9, 14, 15, 0.82)']}
        locations={[0, 0.44, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.statusRowLight, { top: y(20, height) }]}>
        <Text style={styles.statusTextLight}>9:41</Text>
        <Text style={styles.statusTextLight}>⌁ ◒ ▰</Text>
      </View>

      <View style={[styles.completeCopy, { left: x(38, width), right: x(38, width), top: y(322, height) }]}>
        <Text style={styles.completeMessage}>{session.completionMessage}</Text>
        <WeeklyCheckIn
          title="Today’s breath is marked."
          weekCheckIns={weekCheckIns}
          style={styles.completeWeeklyCheckInInline}
          tone="light"
        />
      </View>

      <Pressable onPress={onCreateRoutine} style={[styles.routinePromptCard, { left: x(34, width), right: x(34, width), top: y(628, height) }]}>
        <View style={styles.routinePromptCopy}>
          <Text style={styles.routinePromptTitle}>{routineText}</Text>
          <Text style={styles.routinePromptMeta}>
            This week {weeklyRecordSummary.completedCount} · {formatDurationSummary(weeklyRecordSummary.totalDurationSeconds)}
          </Text>
        </View>
        <Text style={styles.routinePromptAction}>{routineReminder ? 'Edit' : 'Create routine'}</Text>
      </Pressable>

      <View style={[styles.bottomAction, { left: x(22, width), right: x(22, width), bottom: y(30, height) }]}>
        <Pressable onPress={onRestart} style={({ pressed }) => [styles.completeAgainButton, pressed && styles.springPress]}>
          <Text style={styles.completeAgainText}>Breathe again</Text>
        </Pressable>
        <Pressable onPress={onChooseAnother} style={({ pressed }) => [styles.textButton, pressed && styles.springPress]}>
          <Text style={styles.completeChooseText}>Choose another air</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

function RecordsScreen({
  width,
  height,
  destination,
  records,
  summary,
  currentStreak,
  authState,
  authNotice,
  onStartAuth,
  onBack,
}: {
  width: number;
  height: number;
  destination: Destination;
  records: SessionRecord[];
  summary: { completedCount: number; totalDurationSeconds: number };
  currentStreak: number;
  authState: AuthState;
  authNotice: string | null;
  onStartAuth: (provider: Exclude<AuthProvider, 'guest'>) => void;
  onBack: () => void;
}) {
  const showLoginOffer = shouldOfferLogin(authState);
  const exitProgress = useRef(new Animated.Value(1)).current;
  const isClosingRef = useRef(false);
  const handleBackPress = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    Animated.timing(exitProgress, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(onBack);
  }, [exitProgress, onBack]);
  const exitStyle = {
    opacity: exitProgress,
    transform: [
      {
        translateY: exitProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [y(12, height), 0],
        }),
      },
      {
        scale: exitProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.screen, exitStyle]}>
      <ImageBackground
        source={destination.cardImage}
        style={styles.screen}
        imageStyle={styles.recordsBackgroundImage as any}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(8, 13, 16, 0.24)', 'rgba(8, 13, 16, 0.48)', 'rgba(8, 13, 16, 0.88)']}
          locations={[0, 0.44, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.statusRowLight, { top: y(20, height) }]}>
          <Text style={styles.statusTextLight}>9:41</Text>
          <Text style={styles.statusTextLight}>⌁ ◒ ▰</Text>
        </View>
        <Pressable onPress={handleBackPress} style={[styles.recordsBack, { left: x(20, width), top: y(72, height) }]}>
          <Text style={styles.recordsBackText}>‹</Text>
        </Pressable>

        <View style={[styles.recordsHeader, { left: x(30, width), right: x(30, width), top: y(118, height) }]}>
          <Text style={[styles.recordsTitle, { fontSize: s(30, width) }]}>Journal</Text>
          <Text style={styles.recordsSubtitle}>Your completed breaths are saved on this device.</Text>
        </View>

        <View style={[styles.recordsSummaryCard, { left: x(28, width), right: x(28, width), top: y(224, height) }]}>
          <View style={styles.recordsSummaryItem}>
            <Text style={styles.recordsSummaryValue}>{summary.completedCount}</Text>
            <Text style={styles.recordsSummaryLabel}>This week</Text>
          </View>
          <View style={styles.recordsSummaryDivider} />
          <View style={styles.recordsSummaryItem}>
            <Text style={styles.recordsSummaryValue}>{currentStreak}</Text>
            <Text style={styles.recordsSummaryLabel}>Streak</Text>
          </View>
          <View style={styles.recordsSummaryDivider} />
          <View style={styles.recordsSummaryItem}>
            <Text style={styles.recordsSummaryValue}>{formatDurationSummary(summary.totalDurationSeconds)}</Text>
            <Text style={styles.recordsSummaryLabel}>Total time</Text>
          </View>
        </View>

        <View style={[styles.guestHint, { left: x(28, width), right: x(28, width), top: y(334, height) }]}>
          <Text style={styles.guestHintText}>
            {showLoginOffer
              ? 'Back up this journal when Apple or Google sign-in is connected.'
              : `Backed up with ${authState.user.auth_provider}.`}
          </Text>
          {showLoginOffer && (
            <View style={styles.guestAuthActions}>
              <Pressable onPress={() => onStartAuth('apple')} style={({ pressed }) => [styles.guestAuthButton, pressed && styles.springPress]}>
                <Text style={styles.guestAuthButtonText}>Apple</Text>
              </Pressable>
              <Pressable onPress={() => onStartAuth('google')} style={({ pressed }) => [styles.guestAuthButton, pressed && styles.springPress]}>
                <Text style={styles.guestAuthButtonText}>Google</Text>
              </Pressable>
            </View>
          )}
          {authNotice && <Text style={styles.guestAuthNotice}>{authNotice}</Text>}
        </View>

        <ScrollView
          style={[styles.recordsList, { left: x(28, width), right: x(28, width), top: y(showLoginOffer ? 458 : 390, height), bottom: y(24, height) }]}
          contentContainerStyle={records.length === 0 ? styles.recordsListEmptyContent : styles.recordsListContent}
          showsVerticalScrollIndicator={false}
        >
          {records.length === 0 ? (
            <View style={styles.emptyRecords}>
              <Text style={styles.emptyRecordsTitle}>No completed breaths yet.</Text>
              <Text style={styles.emptyRecordsCopy}>Finish a session and it will appear here.</Text>
            </View>
          ) : (
            records.map((record) => (
              <View key={record.record_id} style={styles.recordRow}>
                <View style={styles.recordDatePill}>
                  <Text style={styles.recordDateText}>{formatRecordDate(record.completed_at)}</Text>
                  <Text style={styles.recordTimeText}>{formatRecordTime(record.completed_at)}</Text>
                </View>
                <View style={styles.recordCopy}>
                  <Text style={styles.recordTitle}>{record.session_name}</Text>
                  <Text style={styles.recordMeta}>Completed · {formatDurationSummary(record.duration_seconds)}</Text>
                </View>
                <Text style={styles.recordCheck}>✓</Text>
              </View>
            ))
          )}
        </ScrollView>
      </ImageBackground>
    </Animated.View>
  );
}

function RoutineSetupScreen({
  width,
  height,
  destination,
  completedAt,
  reminder,
  draftReminder,
  notice,
  onSave,
  onChangeDraft,
  onBack,
  onDone,
}: {
  width: number;
  height: number;
  destination: Destination;
  completedAt: Date;
  reminder: RoutineReminder | null;
  draftReminder: RoutineReminder | null;
  notice: string | null;
  onSave: (reminder: RoutineReminder) => void;
  onChangeDraft: (reminder: RoutineReminder) => void;
  onBack: () => void;
  onDone: () => void;
}) {
  const plannedReminder = draftReminder ?? reminder ?? createRoutineReminder(completedAt);
  const hasReminder = reminder !== null;
  const dragStartReminder = useRef(plannedReminder);
  const dragStepRef = useRef(0);
  const timeDragResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
        onPanResponderGrant: () => {
          dragStartReminder.current = plannedReminder;
          dragStepRef.current = 0;
        },
        onPanResponderMove: (_, gesture) => {
          const nextStep = Math.round(-gesture.dy / 16);

          if (nextStep === dragStepRef.current) {
            return;
          }

          dragStepRef.current = nextStep;
          onChangeDraft({
            ...dragStartReminder.current,
            ...addMinutesToRoutineTime(dragStartReminder.current, nextStep * 5),
          });
        },
      }),
    [onChangeDraft, plannedReminder],
  );

  return (
    <ImageBackground
      source={destination.cardImage}
      style={styles.screen}
      imageStyle={styles.routineBackgroundImage as any}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(8, 13, 16, 0.18)', 'rgba(8, 13, 16, 0.34)', 'rgba(8, 13, 16, 0.82)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.statusRowLight, { top: y(20, height) }]}>
        <Text style={styles.statusTextLight}>9:41</Text>
        <Text style={styles.statusTextLight}>⌁ ◒ ▰</Text>
      </View>
      <Pressable onPress={onBack} style={[styles.prepareBack, { left: x(20, width), top: y(72, height) }]}>
        <Text style={styles.prepareBackText}>‹</Text>
      </Pressable>

      <View style={[styles.routineHeader, { left: x(30, width), right: x(30, width), top: y(134, height) }]}>
        <Text style={[styles.routineTitle, { fontSize: s(30, width) }]}>Build a breath routine</Text>
        <Text style={styles.routineDescription}>We’ll send one simple reminder at your chosen time.</Text>
      </View>

      <View
        {...timeDragResponder.panHandlers}
        style={[styles.routineCard, { left: x(28, width), right: x(28, width), top: y(292, height) }]}
      >
        <Text style={styles.routineCardLabel}>Every day</Text>
        <Text style={[styles.routineTime, { fontSize: s(46, width) }]}>{formatRoutineTime(plannedReminder)}</Text>
        <Text style={styles.routineCardMeta}>
          {hasReminder ? 'Drag up or down to edit the time.' : 'Drag up or down to adjust the time.'}
        </Text>
      </View>

      {notice && (
        <View style={[styles.routineNotice, { left: x(28, width), right: x(28, width), top: y(520, height) }]}>
          <Text style={styles.routineNoticeText}>{notice}</Text>
        </View>
      )}

      <View style={[styles.bottomAction, { left: x(22, width), right: x(22, width), bottom: y(44, height) }]}>
        <Pressable
          onPress={() => onSave(plannedReminder)}
          style={({ pressed }) => [styles.prepareBeginButton, pressed && styles.springPress]}
        >
          <Text style={styles.prepareBeginText}>{hasReminder ? 'Save changes' : 'Save daily reminder'}</Text>
        </Pressable>
        <Pressable onPress={onDone} style={({ pressed }) => [styles.textButton, pressed && styles.springPress]}>
          <Text style={styles.prepareChangeText}>{hasReminder ? 'Cancel' : 'Maybe later'}</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

function WeeklyCheckIn({
  title,
  weekCheckIns,
  style,
  tone = 'dark',
}: {
  title: string;
  weekCheckIns: WeekCheckInDay[];
  style: StyleProp<ViewStyle>;
  tone?: 'dark' | 'light';
}) {
  const isLight = tone === 'light';

  return (
    <View style={[styles.weeklyCheckIn, style]}>
      <Text style={[styles.weeklyCheckInTitle, isLight && styles.weeklyCheckInTitleLight]}>{title}</Text>
      <View style={styles.weekdayRow}>
        {weekCheckIns.map((day) => (
          <Text
            key={day.date}
            style={[
              styles.weekdayLabel,
              isLight && styles.weekdayLabelLight,
              day.isToday && styles.weekdayLabelToday,
              isLight && day.isToday && styles.weekdayLabelTodayLight,
            ]}
          >
            {day.weekday}
          </Text>
        ))}
      </View>
      <View style={styles.checkInDotRow}>
        {weekCheckIns.map((day) => (
          <View
            key={day.date}
            style={[
              styles.checkInDot,
              isLight && styles.checkInDotLight,
              day.completed && styles.checkInDotCompleted,
              isLight && day.completed && styles.checkInDotCompletedLight,
              day.isToday && styles.checkInDotToday,
              isLight && day.isToday && styles.checkInDotTodayLight,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const hooStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2F7',
  },
  appLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appFrameLayer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#8DC5DC',
  },
  phone: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#3CA1FB',
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#8DC5DC',
  },
  fullScreenPress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#3CA1FB',
  },
  tactilePressFeedback: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tactilePressOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  guideBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,40,54,0.34)',
  },
  guideCard: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 26,
    paddingTop: 34,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#1b3a49',
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
  },
  guideClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    zIndex: 2,
  },
  guideCloseText: {
    color: '#9bb0ba',
    fontSize: 17,
    fontWeight: '600',
  },
  guideBubbleIcon: {
    width: 52,
    height: 52,
    marginBottom: 10,
  },
  guideTitle: {
    color: '#2b4d5c',
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 18,
  },
  guideSubtitle: {
    color: '#86a0ac',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 16,
  },
  guideSteps: {
    alignSelf: 'stretch',
  },
  guideDivider: {
    height: 1,
    backgroundColor: 'rgba(45,77,92,0.08)',
  },
  guideStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  guideStepNumber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  guideStepNumberText: {
    color: '#4292F2',
    fontSize: 16,
    fontWeight: '800',
  },
  guideStepTexts: {
    flex: 1,
  },
  guideStepTitle: {
    color: '#2b4d5c',
    fontSize: 16,
    fontWeight: '700',
  },
  guideNote: {
    alignSelf: 'stretch',
    backgroundColor: '#F1F6F9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  guideNoteText: {
    color: '#5d7c8a',
    fontSize: 13,
    fontWeight: '600',
  },
  guideStartButton: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 18,
    backgroundColor: '#4292F2',
    overflow: 'hidden',
    shadowColor: '#2F85EA',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  guideStartButtonOverlay: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  guideStartButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  fullBleedImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  moodOptionHit: {
    position: 'absolute',
  },
  moodOptionFeedback: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  moodQuestionBlock: {
    position: 'absolute',
    zIndex: 7,
    alignItems: 'center',
  },
  moodQuestionText: {
    color: '#31576A',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(255,255,255,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  moodQuestionSubtext: {
    marginTop: 4,
    color: '#55788A',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0,
  },
  moodBubbleImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  moodCharacterClip: {
    position: 'absolute',
    left: '4%',
    top: '4%',
    width: '92%',
    height: '92%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  moodCharacterImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  moodBackgroundImage: {
    position: 'absolute',
  },
  moodLabelBlock: {
    position: 'absolute',
    zIndex: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodLabelText: {
    color: '#31576A',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(255,255,255,0.74)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  moodSupportingLabelText: {
    marginTop: 1,
    color: '#557486',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0,
    textShadowColor: 'rgba(255,255,255,0.82)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  sessionBackgroundVideo: {
    position: 'absolute',
  },
  sessionSurfaceWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(181, 226, 244, 0.08)',
  },
  hooHeader: {
    position: 'absolute',
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 20,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonFrame: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonMark: {
    width: 14.1214,
    height: 14.1214,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ translateX: -2 }, { translateY: -1 }, { rotate: '45deg' }],
  },
  backChevronImage: {},
  headerLogoNode: {},
  headerCounter: {
    marginLeft: 'auto',
    width: 69,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerCounterText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  breathDots: {
    position: 'absolute',
  },
  breathDotsImage: {
    position: 'absolute',
  },
  breathDotImage: {
    position: 'absolute',
  },
  breathDotActiveImage: {
    position: 'absolute',
  },
  micPermissionPill: {
    position: 'absolute',
    zIndex: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.62)',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  micPermissionText: {
    color: '#426B7D',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0,
  },
  phaseTimer: {
    position: 'absolute',
    zIndex: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.52)',
  },
  phaseTimerSubtitleSlot: {
    zIndex: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  phaseTimerText: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0,
  },
  phaseTimerTextInhale: {
    color: '#6EAFC6',
  },
  phaseTimerTextExhale: {
    color: '#2F86C7',
  },
  phaseTimerTextLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sessionCopy: {
    position: 'absolute',
    zIndex: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 13,
  },
  countdownText: {
    color: '#5086A0',
    fontWeight: '300',
    textAlign: 'center',
  },
  instructionTitle: {
    color: '#396073',
    fontWeight: '800',
    textAlign: 'center',
  },
  instructionSubtitle: {
    color: '#396073',
    fontWeight: '400',
    textAlign: 'center',
  },
  hooWand: {
    position: 'absolute',
    zIndex: 6,
  },
  inhaleFlowLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  inhaleRingGlow: {
    position: 'absolute',
    zIndex: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.52)',
    backgroundColor: 'rgba(190, 238, 255, 0.1)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  inhaleAirParticle: {
    position: 'absolute',
    zIndex: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.58,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  hooCharacter: {
    position: 'absolute',
    zIndex: 7,
  },
  captureBubble: {
    position: 'absolute',
    zIndex: 5,
  },
  completeBubble: {
    position: 'absolute',
    zIndex: 5,
  },
  completeCharacterFloat: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 7,
  },
  completionFooterMotion: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 21,
  },
  collectionSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 45,
    justifyContent: 'flex-end',
  },
  collectionSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,40,54,0.42)',
  },
  collectionSheet: {
    position: 'absolute',
    borderRadius: 28,
    paddingTop: 13,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.97)',
    shadowColor: '#1b3a49',
    shadowOpacity: 0.2,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
  },
  collectionSheetGrabber: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(62,99,118,0.13)',
    marginBottom: 14,
  },
  collectionSheetCharacterRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#EAF6FC',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#8ED7F5',
    shadowOpacity: 0.23,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
  },
  collectionSheetCharacter: {
    width: 72,
    height: 72,
  },
  collectionSheetTitle: {
    color: '#2b4d5c',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0,
  },
  collectionSheetSubtitle: {
    color: '#5d7c8a',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 7,
  },
  collectionSheetProgressBlock: {
    alignSelf: 'stretch',
    marginTop: 24,
    marginBottom: 18,
  },
  collectionSheetProgressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  collectionSheetCount: {
    color: '#2b4d5c',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
  },
  collectionSheetTotal: {
    color: '#5d7c8a',
    fontSize: 18,
    fontWeight: '800',
  },
  collectionSheetProgressMeta: {
    color: '#6f8b98',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },
  collectionSheetProgressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#E8F0FA',
  },
  collectionSheetProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3F85F5',
  },
  collectionSheetPrimary: {
    alignSelf: 'stretch',
    height: 56,
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#3F85F5',
    shadowColor: '#2F85EA',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  collectionSheetPrimaryOverlay: {
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  collectionSheetPrimaryText: {
    color: '#F7FCFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  collectionSheetSecondary: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  collectionSheetSecondaryText: {
    color: '#3F85F5',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  collectionScreen: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#F8FCFF',
  },
  collectionHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  collectionBackButton: {
    position: 'absolute',
    top: 0,
    width: 36,
    height: 36,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#7EABC0',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  collectionBackButtonOverlay: {
    borderRadius: 18,
    backgroundColor: 'rgba(66,146,242,0.12)',
  },
  collectionBackIcon: {
    width: 18,
    height: 18,
    tintColor: '#315D71',
  },
  collectionTitle: {
    color: '#2b4d5c',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 38,
  },
  collectionSubtitle: {
    color: '#5d7c8a',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  collectionSummaryCard: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#8CB9CE',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  collectionSummaryImageWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6FC',
    marginRight: 18,
  },
  collectionSummaryImage: {
    width: 88,
    height: 88,
  },
  collectionSummaryCopy: {
    flex: 1,
  },
  collectionSummaryEyebrow: {
    color: '#6f8b98',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  collectionSummaryCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  collectionSummaryCount: {
    color: '#2b4d5c',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
  },
  collectionSummaryTotal: {
    color: '#5d7c8a',
    fontSize: 17,
    fontWeight: '800',
  },
  collectionSummaryLabel: {
    color: '#5d7c8a',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
    marginBottom: 12,
  },
  collectionProgressTrack: {
    height: 7,
    marginTop: 12,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#E8F0FA',
  },
  collectionProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#3F85F5',
  },
  collectionTabs: {
    position: 'absolute',
    zIndex: 3,
    flexDirection: 'row',
    gap: 8,
  },
  collectionTab: {
    flex: 1,
    height: 38,
    overflow: 'hidden',
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.94)',
    shadowColor: '#8CB9CE',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  collectionTabActive: {
    backgroundColor: '#3F85F5',
  },
  collectionTabOverlay: {
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  collectionTabText: {
    color: '#6f8b98',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  collectionTabTextActive: {
    color: '#FFFFFF',
  },
  collectionGridScroll: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  collectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  collectionCard: {
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  collectionCardCaptured: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#8CB9CE',
    shadowOpacity: 0.13,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
  },
  collectionCardRecent: {
    borderColor: '#6EA6FF',
    borderWidth: 2,
  },
  collectionCardImage: {
    marginTop: 0,
  },
  collectionCardName: {
    color: '#3F85F5',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 7,
    marginTop: -3,
  },
  collectionCardEmptyNameSlot: {
    height: 18,
    marginTop: -3,
  },
  floatingBubbleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  floatingBubble: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBubbleGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(105, 220, 255, 0.16)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.72,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 0 },
  },
  floatingBubbleDepthCore: {
    position: 'absolute',
    left: '14%',
    top: '18%',
    width: '72%',
    height: '70%',
    borderRadius: 999,
    backgroundColor: 'rgba(158, 233, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#78CDE8',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: -3, height: 5 },
  },
  floatingBubbleImage: {
    width: '100%',
    height: '100%',
  },
  floatingBubbleSpecular: {
    position: 'absolute',
    left: '22%',
    top: '18%',
    width: '24%',
    height: '16%',
    borderRadius: 999,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.86)',
    transform: [{ rotate: '-24deg' }],
  },
  floatingBubbleSpecularSmall: {
    position: 'absolute',
    right: '24%',
    top: '26%',
    width: '10%',
    height: '8%',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
  },
  floatingBubbleLowerRim: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    bottom: '17%',
    height: '18%',
    borderRadius: 999,
    borderBottomWidth: 1.4,
    borderColor: 'rgba(77, 145, 166, 0.28)',
    opacity: 0.7,
  },
  completeButtons: {
    position: 'absolute',
    zIndex: 20,
  },
  completeButtonShape: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 23,
  },
  completeButtonShapeMuted: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  completeButtonShapePrimary: {
    backgroundColor: '#4292F2',
    shadowColor: '#2F85EA',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  completeButtonsImage: {
    ...StyleSheet.absoluteFillObject,
  },
  completeButtonHit: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 23,
  },
  completeButtonPressOverlay: {
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  completeButtonLabel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 15,
    lineHeight: 56,
    fontWeight: '800',
    letterSpacing: 0,
    zIndex: 1,
  },
  completeButtonLabelMuted: {
    color: '#3B86E6',
    opacity: 1,
  },
  completeButtonLabelPrimary: {
    color: '#F7FCFF',
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F1EC',
  },
  phoneFrame: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#EEF3F1',
  },
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  onboardingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  statusRow: {
    position: 'absolute',
    left: 26,
    right: 26,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusRowLight: {
    position: 'absolute',
    left: 26,
    right: 26,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusText: {
    color: '#172035',
    fontSize: 13,
    fontWeight: '700',
  },
  statusTextLight: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    fontWeight: '700',
  },
  copyBlock: {
    position: 'absolute',
    gap: 14,
  },
  splashScreen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#BFE6F3',
  },
  splashLogo: {
    opacity: 0.94,
  },
  ticketHeroCopy: {
    position: 'absolute',
    alignItems: 'center',
  },
  ticketForeground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
  },
  ticketBackgroundImage: {
    width: '100%',
    height: '100%',
  },
  ticketBackgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  ticketArrivalPreviewLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  ticketArrivalPreviewTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 23, 27, 0.18)',
  },
  ticketHeroMain: {
    color: 'rgba(36, 38, 41, 0.86)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontWeight: '600',
    letterSpacing: 0,
    textAlign: 'center',
  },
  ticketHeroSerif: {
    color: 'rgba(36, 38, 41, 0.84)',
    fontFamily: Platform.select({ web: 'Georgia', default: 'serif' }),
    fontStyle: 'italic',
    fontWeight: '400',
    letterSpacing: 0,
    textAlign: 'center',
  },
  ticketHeroSerifLoaded: {
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
  },
  placeSerifLoaded: {
    fontFamily: 'PlayfairDisplay_400Regular',
  },
  ticketHeroSub: {
    marginTop: 12,
    color: 'rgba(36, 38, 41, 0.42)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    textAlign: 'center',
  },
  ticketBoardingCard: {
    position: 'absolute',
    minHeight: 238,
    paddingHorizontal: 28,
    paddingVertical: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#667064',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  ticketBoardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  ticketBoardingLabel: {
    color: '#435873',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  ticketBoardingPlane: {
    color: '#435873',
    fontSize: 31,
    lineHeight: 31,
  },
  ticketBoardingGroup: {
    gap: 8,
    marginBottom: 24,
  },
  ticketBoardingSmall: {
    color: '#435873',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  ticketBoardingValue: {
    color: '#435873',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0,
  },
  ticketDestinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ticketDestinationCopy: {
    flex: 1,
    minWidth: 0,
  },
  ticketDestinationMood: {
    marginTop: 6,
    color: 'rgba(67, 88, 115, 0.50)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  ticketDestinationControls: {
    flexDirection: 'row',
    gap: 6,
  },
  ticketDestinationButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: 'rgba(67, 88, 115, 0.08)',
  },
  ticketDestinationButtonText: {
    marginTop: -2,
    color: '#435873',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 26,
  },
  ticketFogCurtain: {
    position: 'absolute',
    left: -105,
    top: 412,
    width: 600,
    height: 600,
    zIndex: 18,
    borderRadius: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 92,
    shadowOffset: { width: 0, height: 0 },
  },
  ticketStartButtonFrame: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    height: 172,
    zIndex: 24,
  },
  ticketStartButtonTouch: {
    width: 142,
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 71,
  },
  ticketStartButton: {
    width: 106,
    height: 106,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 53,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    shadowColor: '#9FA9A6',
    shadowOpacity: 0.26,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  ticketStartGlow: {
    position: 'absolute',
    width: 146,
    height: 146,
    borderRadius: 73,
    backgroundColor: 'rgba(255, 255, 255, 0.30)',
  },
  ticketHoldRing: {
    position: 'absolute',
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
  },
  ticketHoldArc: {
    position: 'absolute',
    left: -1,
    top: -1,
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 4,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(255, 255, 255, 0.92)',
    borderTopColor: 'rgba(255, 255, 255, 0.92)',
  },
  ticketStartArrow: {
    marginTop: -2,
    color: 'rgba(79, 83, 84, 0.50)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
  ticketStartText: {
    marginTop: 4,
    color: '#768B76',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },
  arrivalVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  arrivalVideoLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  arrivalVideoTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 23, 27, 0.18)',
  },
  arrivalUiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  arrivalRevealMist: {
    position: 'absolute',
    left: -120,
    right: -120,
    top: 260,
    height: 420,
    zIndex: 18,
    borderRadius: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 1,
    shadowRadius: 86,
    shadowOffset: { width: 0, height: 0 },
  },
  arrivalBackButton: {
    position: 'absolute',
    zIndex: 24,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
  },
  arrivalBackText: {
    marginTop: -2,
    color: 'rgba(17, 25, 45, 0.72)',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
  },
  arrivalTopActions: {
    position: 'absolute',
    zIndex: 24,
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  arrivalActionButton: {
    minWidth: 54,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  arrivalActionText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.32)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  arrivalActionMeta: {
    color: 'rgba(255, 255, 255, 0.54)',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  arrivalPrompt: {
    position: 'absolute',
    zIndex: 21,
    alignItems: 'center',
  },
  arrivalPromptText: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.26)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  arrivalPromptRule: {
    width: 16,
    height: 1,
    marginTop: 10,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  arrivalCopy: {
    position: 'absolute',
    zIndex: 21,
    alignItems: 'center',
  },
  arrivalEyebrow: {
    marginBottom: 10,
    color: 'rgba(255, 255, 255, 0.74)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  arrivalTitle: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ web: 'Georgia', default: 'serif' }),
    fontWeight: '400',
    letterSpacing: 0,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  arrivalTitleItalic: {
    fontStyle: 'italic',
  },
  arrivalSubtitle: {
    maxWidth: 264,
    marginTop: 12,
    color: 'rgba(255, 255, 255, 0.78)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  arrivalSessionCard: {
    position: 'absolute',
    zIndex: 22,
    padding: 16,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    shadowColor: '#172330',
    shadowOpacity: 0.22,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 22 },
    gap: 10,
  },
  arrivalCardEyebrow: {
    color: 'rgba(17, 25, 45, 0.48)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  arrivalCardTitle: {
    marginBottom: 2,
    color: '#11192D',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: 0,
  },
  airPreviewPanel: {
    position: 'absolute',
    zIndex: 22,
    height: 184,
    justifyContent: 'center',
  },
  airPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  airPreviewCounter: {
    color: 'rgba(17, 25, 45, 0.48)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 12,
    fontWeight: '800',
  },
  airPreviewFocusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  airPreviewFocusPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(17, 25, 45, 0.06)',
  },
  airPreviewFocusLabel: {
    color: 'rgba(17, 25, 45, 0.62)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
  },
  airPreviewRail: {
    alignItems: 'flex-end',
    gap: 9,
    paddingHorizontal: 24,
    paddingBottom: 2,
  },
  airPreviewThumb: {
    overflow: 'hidden',
    width: 92,
    height: 126,
    borderRadius: 14,
    borderWidth: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#03080A',
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  airPreviewThumbSelected: {
    width: 132,
    height: 172,
    borderRadius: 18,
    borderWidth: 1.8,
  },
  airPreviewThumbImage: {
    ...StyleSheet.absoluteFillObject,
  },
  airPreviewThumbImageSelected: {
    ...StyleSheet.absoluteFillObject,
  },
  airPreviewThumbGlow: {
    position: 'absolute',
    left: -18,
    top: -18,
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.72,
  },
  airPreviewThumbHorizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 42,
    height: 34,
    opacity: 0.34,
  },
  airPreviewThumbLand: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    height: 18,
    borderRadius: 12,
    opacity: 0.84,
  },
  airPreviewThumbShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  airPreviewSelectedMark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(238, 244, 239, 0.88)',
  },
  airPreviewSelectedMarkText: {
    color: '#667B68',
    fontSize: 17,
    fontWeight: '800',
  },
  airPreviewThumbTitle: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  airPreviewActions: {
    position: 'absolute',
    zIndex: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  airPreviewStepButton: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(17, 25, 45, 0.06)',
  },
  airPreviewStepText: {
    marginTop: -2,
    color: 'rgba(17, 25, 45, 0.62)',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  airPreviewChooseButton: {
    flex: 1,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    borderRadius: 31,
    backgroundColor: 'rgba(112, 129, 108, 0.78)',
    shadowColor: '#03080A',
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
  },
  airPreviewChooseText: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 15,
    fontWeight: '800',
  },
  airPreviewChooseArrow: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  airGlobeDock: {
    position: 'absolute',
    zIndex: 22,
    height: 292,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  airDialGlassPanel: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: 96,
    height: 218,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.075)',
    shadowColor: '#03080A',
    shadowOpacity: 0.16,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 18 },
  },
  airDialMotion: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
  },
  airDialPeek: {
    position: 'absolute',
    top: 38,
    overflow: 'hidden',
    width: 118,
    height: 188,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#03080A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  airDialPeekImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
    backgroundColor: 'rgba(12, 16, 18, 0.34)',
  },
  airDialPeekShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 12, 14, 0.20)',
  },
  airDialPeekLeft: {
    left: -56,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    transform: [{ rotate: '-8deg' }],
  },
  airDialPeekRight: {
    right: -56,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    transform: [{ rotate: '8deg' }],
  },
  airDialPeekGlyph: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 25,
    fontWeight: '200',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.30)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  airDialCard: {
    position: 'absolute',
    top: 0,
    overflow: 'hidden',
    width: 176,
    height: 238,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    shadowColor: '#03080A',
    shadowOpacity: 0.22,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 24 },
  },
  airDialCardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  airDialCardScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  airDialCardContent: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 17,
  },
  airDialCardTitle: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ web: 'Georgia', default: 'serif' }),
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 29,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.46)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  airDialCardSubtitle: {
    marginTop: 5,
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
    textAlign: 'left',
    textShadowColor: 'rgba(0, 0, 0, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  airDialRail: {
    position: 'absolute',
    top: 252,
    width: 72,
    height: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  airDialRailThumb: {
    width: 24,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
  },
  airGlobeClip: {
    position: 'absolute',
    top: 190,
    overflow: 'hidden',
    width: 390,
    height: 112,
    alignItems: 'center',
  },
  airGlobeSphere: {
    position: 'relative',
    overflow: 'hidden',
    width: 356,
    height: 356,
    borderRadius: 178,
    borderWidth: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    shadowColor: '#03080A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  airGlobeLatitudeStrong: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: '38%',
    height: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
  },
  airGlobeLatitude: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: 0.7,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  airGlobeLongitude: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    width: 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    transform: [{ rotate: '10deg' }],
  },
  airGlobeLand: {
    position: 'absolute',
    left: 70,
    top: 64,
    width: 92,
    height: 34,
    borderRadius: 30,
    opacity: 0.10,
    transform: [{ rotate: '-16deg' }],
  },
  airGlobeLandTwo: {
    position: 'absolute',
    right: 56,
    top: 114,
    width: 104,
    height: 28,
    borderRadius: 24,
    opacity: 0.08,
    transform: [{ rotate: '14deg' }],
  },
  airGlobeCenter: {
    position: 'absolute',
    top: 183,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.58)',
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  airGlobeCenterDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  airGlobeArrow: {
    position: 'absolute',
    top: 230,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  airGlobeArrowLeft: {
    left: 42,
  },
  airGlobeArrowRight: {
    right: 42,
  },
  airGlobeArrowText: {
    marginTop: -2,
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  airGlobeHint: {
    position: 'absolute',
    top: 266,
    color: 'rgba(255, 255, 255, 0.62)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  arrivalSessionOption: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(17, 25, 45, 0.055)',
  },
  arrivalSessionMeta: {
    color: 'rgba(17, 25, 45, 0.58)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
  },
  arrivalSessionName: {
    marginTop: 3,
    color: '#11192D',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 14,
    fontWeight: '700',
  },
  arrivalSessionArrow: {
    color: '#11192D',
    fontSize: 18,
    fontWeight: '700',
  },
  arrivalSessionTextActive: {
    color: '#FFFFFF',
  },
  destinationSoftLight: {
    position: 'absolute',
    left: -90,
    right: -90,
    top: 168,
    height: 408,
    borderRadius: 240,
    opacity: 0.54,
  },
  destinationTopBar: {
    position: 'absolute',
    zIndex: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  destinationIconButton: {
    ...glassStrong,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  destinationIconText: {
    marginTop: -2,
    color: 'rgba(16, 26, 61, 0.68)',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
  },
  destinationCounter: {
    color: 'rgba(16, 26, 61, 0.48)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  destinationCopy: {
    position: 'absolute',
    zIndex: 10,
  },
  destinationEyebrow: {
    marginBottom: 10,
    color: 'rgba(16, 26, 61, 0.46)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  destinationTitle: {
    maxWidth: 312,
    color: '#101A3D',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontWeight: '700',
    letterSpacing: 0,
  },
  destinationGlobeStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationThreeMount: {
    alignItems: 'center',
    justifyContent: 'center',
    filter: Platform.OS === 'web' ? 'drop-shadow(0 30px 42px rgba(45, 68, 86, 0.18))' : undefined,
  } as any,
  destinationFallbackGlobe: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D4456',
    shadowOpacity: 0.2,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 30 },
  },
  destinationFallbackGlow: {
    position: 'absolute',
    width: '86%',
    height: '86%',
    borderRadius: 999,
    opacity: 0.34,
  },
  destinationFallbackLand: {
    width: '58%',
    height: '24%',
    borderRadius: 999,
    opacity: 0.58,
    transform: [{ rotate: '-18deg' }],
  },
  destinationArrow: {
    ...glassRegular,
    position: 'absolute',
    top: '43%',
    zIndex: 16,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  destinationArrowLeft: {
    left: 28,
  },
  destinationArrowRight: {
    right: 28,
  },
  destinationArrowText: {
    marginTop: -2,
    color: 'rgba(16, 26, 61, 0.62)',
    fontSize: 31,
    fontWeight: '300',
    lineHeight: 34,
  },
  destinationHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 12,
    alignItems: 'center',
  },
  destinationHintText: {
    ...glassSoft,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    color: 'rgba(16, 26, 61, 0.48)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 11,
    fontWeight: '700',
  },
  destinationDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  destinationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(16, 26, 61, 0.20)',
  },
  destinationPillScroll: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 14,
    maxHeight: 42,
  },
  destinationPillRow: {
    paddingHorizontal: 22,
    gap: 8,
    alignItems: 'center',
  },
  destinationPill: {
    ...glassSoft,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  destinationPillText: {
    color: 'rgba(16, 26, 61, 0.58)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 12,
    fontWeight: '700',
  },
  destinationPillTextActive: {
    color: '#FFFFFF',
  },
  destinationPanel: {
    ...glassStrong,
    position: 'absolute',
    zIndex: 18,
    minHeight: 130,
    padding: 16,
    borderRadius: 28,
  },
  destinationPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  destinationCountry: {
    color: 'rgba(16, 26, 61, 0.48)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  destinationName: {
    marginTop: 3,
    color: '#101A3D',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: 0,
  },
  destinationMiniOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  destinationMood: {
    marginBottom: 13,
    color: 'rgba(16, 26, 61, 0.56)',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  destinationContinueButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  destinationContinueText: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0,
  },
  planeWindow: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 20,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: '#E6ECEB',
    shadowColor: '#9EA69E',
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  windowSky: {
    flex: 1,
    borderRadius: 100,
  },
  windowWing: {
    position: 'absolute',
    left: 92,
    top: 158,
    width: 140,
    height: 34,
    borderRadius: 40,
    backgroundColor: 'rgba(118, 128, 130, 0.24)',
    transform: [{ rotate: '-18deg' }],
  },
  windowCloudLarge: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: 34,
    height: 108,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  windowCloudSmall: {
    position: 'absolute',
    left: 58,
    right: 34,
    bottom: 118,
    height: 50,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  onboardingCopy: {
    position: 'absolute',
    alignItems: 'center',
    gap: 10,
  },
  appName: {
    color: '#0C183F',
    fontWeight: '500',
    letterSpacing: -0.5,
  },
  onboardingCaption: {
    color: 'rgba(12,24,63,0.58)',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
  onboardingNotice: {
    maxWidth: 300,
    color: 'rgba(12,24,63,0.46)',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  onboardingActions: {
    position: 'absolute',
    gap: 8,
  },
  authButton: {
    ...glassStrong,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 26,
  },
  authButtonSecondary: {
    ...glassRegular,
  },
  authButtonIcon: {
    width: 18,
    color: '#0C183F',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  authButtonText: {
    color: '#0C183F',
    fontSize: 15,
    fontWeight: '800',
  },
  browseButton: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseButtonText: {
    color: '#0C183F',
    fontSize: 14,
    fontWeight: '800',
  },
  legalText: {
    marginTop: 2,
    color: 'rgba(12,24,63,0.42)',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomAction: {
    position: 'absolute',
    gap: 14,
  },
  subtlePill: {
    ...glassRegular,
    alignSelf: 'center',
    minWidth: 142,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  subtlePillText: {
    color: '#0C183F',
    fontSize: 14,
    fontWeight: '700',
  },
  leafCluster: {
    position: 'absolute',
    right: 18,
    top: 6,
    width: 116,
    height: 112,
  },
  leafOne: {
    position: 'absolute',
    right: 42,
    top: 24,
    width: 14,
    height: 26,
    borderRadius: 14,
    backgroundColor: 'rgba(117,134,101,0.38)',
    transform: [{ rotate: '34deg' }],
  },
  leafTwo: {
    position: 'absolute',
    right: 20,
    top: 48,
    width: 12,
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(117,134,101,0.32)',
    transform: [{ rotate: '-28deg' }],
  },
  leafThree: {
    position: 'absolute',
    right: 72,
    top: 72,
    width: 11,
    height: 22,
    borderRadius: 12,
    backgroundColor: 'rgba(117,134,101,0.26)',
    transform: [{ rotate: '18deg' }],
  },
  heroDark: {
    color: '#172035',
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  bodyDark: {
    color: 'rgba(23,32,53,0.55)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  ticketCard: {
    ...glassRegular,
    position: 'absolute',
    gap: 16,
    padding: 22,
    borderRadius: 24,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketLabel: {
    color: 'rgba(23,32,53,0.46)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  ticketPlane: {
    color: '#172035',
    fontSize: 19,
  },
  ticketRow: {
    gap: 6,
  },
  ticketSmall: {
    color: 'rgba(23,32,53,0.46)',
    fontSize: 12,
    fontWeight: '700',
  },
  ticketValue: {
    color: '#172035',
    fontSize: 14,
    fontWeight: '800',
  },
  ticketRoute: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(23,32,53,0.14)',
  },
  greenButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#6F856F',
    shadowColor: '#506948',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  greenButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  textButton: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonText: {
    color: '#6F856F',
    fontSize: 13,
    fontWeight: '800',
  },
  mapMenu: {
    position: 'absolute',
    zIndex: 10,
  },
  mapMenuText: {
    color: '#172035',
    fontSize: 22,
    fontWeight: '400',
  },
  profileDot: {
    ...glassRegular,
    position: 'absolute',
    zIndex: 10,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  profileDotText: {
    color: 'rgba(23,32,53,0.62)',
    fontSize: 15,
  },
  mapTexture: {
    ...StyleSheet.absoluteFillObject,
  },
  mapCloud: {
    position: 'absolute',
    width: 230,
    height: 145,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.44)',
  },
  mapCloudSmall: {
    position: 'absolute',
    width: 200,
    height: 120,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  mapIsland: {
    position: 'absolute',
    width: 110,
    height: 54,
    borderRadius: 30,
    backgroundColor: 'rgba(172,190,194,0.16)',
  },
  routeLine: {
    position: 'absolute',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(23,32,53,0.16)',
  },
  mapPlane: {
    position: 'absolute',
    zIndex: 8,
  },
  mapPlaneText: {
    color: '#263247',
    fontSize: 30,
    shadowColor: '#263247',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  mapPin: {
    position: 'absolute',
    zIndex: 7,
    width: 42,
    height: 42,
    marginLeft: -21,
    marginTop: -21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#6F856F',
    shadowColor: '#3B4A44',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  pinDotActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#587259',
  },
  mapCard: {
    ...glassStrong,
    position: 'absolute',
    zIndex: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
  },
  mapCardThumb: {
    width: 52,
    height: 72,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: 'rgba(16,22,28,0.18)',
  },
  mapCardThumbVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  mapCardCopy: {
    flex: 1,
    gap: 5,
  },
  mapCardTitle: {
    color: '#172035',
    fontFamily: Platform.select({ web: 'Georgia', default: 'serif' }),
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 18,
  },
  mapCardDesc: {
    color: 'rgba(23,32,53,0.56)',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
  },
  mapCardPlay: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(23,32,53,0.12)',
  },
  mapCardPlayText: {
    color: '#172035',
    fontSize: 16,
    lineHeight: 16,
  },
  mapBottomNav: {
    ...glassStrong,
    position: 'absolute',
    zIndex: 12,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 22,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {
    alignItems: 'center',
    gap: 4,
  },
  navIcon: {
    color: '#6F856F',
    fontSize: 17,
  },
  navTextActive: {
    color: '#6F856F',
    fontSize: 10,
    fontWeight: '800',
  },
  navText: {
    color: 'rgba(23,32,53,0.46)',
    fontSize: 10,
    fontWeight: '700',
  },
  floatingStart: {
    position: 'absolute',
    right: 22,
    bottom: 106,
    zIndex: 14,
    height: 42,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#6F856F',
  },
  floatingStartText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  prepareBackgroundImage: {
    transform: [{ scale: 1.05 }],
  },
  prepareVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  prepareBack: {
    ...glassRegular,
    position: 'absolute',
    zIndex: 10,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  prepareClose: {
    ...glassRegular,
    position: 'absolute',
    zIndex: 10,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  prepareBackText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
  prepareHeader: {
    position: 'absolute',
    zIndex: 11,
    alignItems: 'center',
    gap: 10,
  },
  prepareDestination: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ web: 'Georgia', default: 'serif' }),
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.34)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },
  prepareMetricStack: {
    position: 'absolute',
    zIndex: 12,
    gap: 8,
  },
  prepareMetric: {
    ...glassSoft,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  prepareMetricLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0,
  },
  prepareMetricValue: {
    maxWidth: 176,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  prepareBeginButton: {
    ...glassStrong,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.84)',
  },
  prepareBeginText: {
    color: '#13201E',
    fontSize: 15,
    fontWeight: '600',
  },
  prepareBeginArrow: {
    marginTop: -1,
    color: 'rgba(19,32,30,0.62)',
    fontSize: 17,
    fontWeight: '500',
  },
  prepareChangeText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '500',
  },
  backgroundVideo: {
    position: 'absolute',
    top: -70,
    bottom: 0,
    left: -150,
    right: -46,
  },
  breathScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 27, 33, 0.14)',
  },
  musicButton: {
    ...glassRegular,
    position: 'absolute',
    zIndex: 10,
    minWidth: 108,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 19,
  },
  musicButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  musicButtonLabel: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 11,
    fontWeight: '700',
  },
  softRevealGhostText: {
    color: 'rgba(255,255,255,0.46)',
    textShadowColor: 'rgba(255,255,255,0.48)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(7px)' } as any) : null),
  },
  softRevealInline: {
    position: 'relative',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  softRevealInlineGhost: {
    position: 'absolute',
    textShadowColor: 'rgba(255,255,255,0.72)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(9px)' } as any) : null),
  },
  breathPhase: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 4,
    color: 'rgba(255,255,255,0.68)',
    fontWeight: '400',
    textAlign: 'center',
  },
  breathGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  breathRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.42)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  breathTimer: {
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'System', default: 'System' }),
    fontWeight: '300',
  },
  breathRemain: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.52)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.2,
  },
  exhaleLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  rhythmLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  finishLink: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  finishLinkText: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 11,
    fontWeight: '500',
  },
  musicButtonLight: {
    ...glassStrong,
    position: 'absolute',
    zIndex: 10,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.74)',
  },
  musicButtonLightText: {
    color: '#6F856F',
    fontSize: 17,
  },
  completeBackgroundImage: {
    transform: [{ scale: 1.04 }],
  },
  completeCopy: {
    position: 'absolute',
    zIndex: 12,
    alignItems: 'center',
    gap: 10,
  },
  completeTitle: {
    alignSelf: 'center',
    color: '#FFFFFF',
    fontFamily: Platform.select({ web: 'Georgia', default: 'serif' }),
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.36)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },
  completeMessage: {
    maxWidth: 300,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 19,
    fontWeight: '600',
    lineHeight: 27,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.26)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  completeAgainButton: {
    ...glassStrong,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.84)',
  },
  completeAgainText: {
    color: '#13201E',
    fontSize: 15,
    fontWeight: '600',
  },
  completeChooseText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontWeight: '500',
  },
  weeklyCheckIn: {
    ...glassRegular,
    position: 'absolute',
    zIndex: 24,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  mapWeeklyCheckIn: {
    ...glassStrong,
  },
  completeWeeklyCheckIn: {
    minHeight: 102,
    justifyContent: 'center',
    ...glassSoft,
  },
  completeWeeklyCheckInInline: {
    position: 'relative',
    alignSelf: 'center',
    width: 276,
    minHeight: 98,
    marginTop: 6,
    justifyContent: 'center',
    ...glassSoft,
  },
  routinePromptCard: {
    ...glassRegular,
    position: 'absolute',
    zIndex: 24,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  routinePromptCopy: {
    flex: 1,
    gap: 4,
  },
  routinePromptTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  routinePromptMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  routinePromptAction: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  routineHeader: {
    position: 'absolute',
    gap: 11,
  },
  routineTitle: {
    color: '#FFFFFF',
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.34)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },
  routineDescription: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    textShadowColor: 'rgba(0,0,0,0.26)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  routineBackgroundImage: {
    transform: [{ scale: 1.04 }],
  },
  routineCard: {
    ...glassRegular,
    position: 'absolute',
    minHeight: 178,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 24,
  },
  routineCardLabel: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  routineTime: {
    color: '#FFFFFF',
    fontWeight: '300',
    textShadowColor: 'rgba(0,0,0,0.34)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  routineCardMeta: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  routineNotice: {
    ...glassSoft,
    position: 'absolute',
    paddingVertical: 13,
    paddingHorizontal: 15,
    borderRadius: 16,
  },
  routineNoticeText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  recordsBack: {
    position: 'absolute',
    zIndex: 10,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordsBackText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 32,
    fontWeight: '300',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  recordsHeader: {
    position: 'absolute',
    gap: 10,
  },
  recordsTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.34)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
  },
  recordsSubtitle: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
    textShadowColor: 'rgba(0,0,0,0.26)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  recordsBackgroundImage: {
    transform: [{ scale: 1.04 }],
  },
  recordsSummaryCard: {
    ...glassRegular,
    position: 'absolute',
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  recordsSummaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  recordsSummaryValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  recordsSummaryLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recordsSummaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  guestHint: {
    ...glassSoft,
    position: 'absolute',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 16,
    gap: 10,
  },
  guestHintText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  guestAuthActions: {
    flexDirection: 'row',
    gap: 8,
  },
  guestAuthButton: {
    ...glassSoft,
    minWidth: 74,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  guestAuthButtonText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '800',
  },
  guestAuthNotice: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  recordsList: {
    position: 'absolute',
  },
  recordsListContent: {
    gap: 10,
    paddingBottom: 12,
  },
  recordsListEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyRecords: {
    ...glassSoft,
    alignItems: 'center',
    gap: 8,
    padding: 26,
    borderRadius: 20,
  },
  emptyRecordsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyRecordsCopy: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  recordRow: {
    ...glassSoft,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
  },
  recordDatePill: {
    ...glassSoft,
    width: 74,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: 14,
  },
  recordDateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  recordTimeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '800',
  },
  recordCopy: {
    flex: 1,
    gap: 5,
  },
  recordTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  recordMeta: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 12,
    fontWeight: '700',
  },
  recordCheck: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 18,
    fontWeight: '700',
  },
  weeklyCheckInTitle: {
    color: '#172035',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  weeklyCheckInTitleLight: {
    color: 'rgba(255,255,255,0.68)',
    fontWeight: '400',
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: 7,
  },
  weekdayLabel: {
    width: 13,
    color: 'rgba(23,32,53,0.46)',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  weekdayLabelLight: {
    color: 'rgba(255,255,255,0.42)',
    fontWeight: '600',
  },
  weekdayLabelToday: {
    color: '#172035',
  },
  weekdayLabelTodayLight: {
    color: 'rgba(255,255,255,0.82)',
  },
  checkInDotRow: {
    flexDirection: 'row',
    gap: 7,
  },
  checkInDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(23,32,53,0.26)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  checkInDotLight: {
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  checkInDotCompleted: {
    borderColor: '#172035',
    backgroundColor: '#172035',
  },
  checkInDotCompletedLight: {
    borderColor: 'rgba(255,255,255,0.82)',
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  checkInDotToday: {
    borderWidth: 2,
    borderColor: '#6F856F',
  },
  checkInDotTodayLight: {
    borderColor: 'rgba(255,255,255,0.94)',
  },
  springPress: {
    transform: [{ scale: 0.96 }],
  },
});
