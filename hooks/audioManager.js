import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'

const SOUND_ENABLED_KEY = 'soundEnabled'

let enabledCache = true
let cacheLoaded = false
let currentSound = null
let currentKey = null
let pendingKey = null

const setGlobalAudioEnabled = async (enabled) => {
  try {
    await Audio.setIsEnabledAsync(enabled)
  } catch (error) {
    console.log('audio enable error', error)
  }
}

const stopCurrentSound = async () => {
  const sound = currentSound
  currentSound = null
  currentKey = null
  if (!sound) return
  try {
    await sound.stopAsync()
  } catch (error) {
    console.log('audio stop error', error)
  }
  try {
    await sound.unloadAsync()
  } catch (error) {
    console.log('audio unload error', error)
  }
}

export const ensureSoundPreferenceLoaded = async () => {
  if (cacheLoaded) return enabledCache
  try {
    const stored = await AsyncStorage.getItem(SOUND_ENABLED_KEY)
    enabledCache = stored !== '0'
    cacheLoaded = true
    await setGlobalAudioEnabled(enabledCache)
    return enabledCache
  } catch (error) {
    console.log('audio preference load error', error)
    cacheLoaded = true
    enabledCache = true
    await setGlobalAudioEnabled(true)
    return enabledCache
  }
}

export const setSoundPreference = async (enabled) => {
  enabledCache = enabled
  cacheLoaded = true
  try {
    await AsyncStorage.setItem(SOUND_ENABLED_KEY, enabled ? '1' : '0')
  } catch (error) {
    console.log('audio preference save error', error)
  }
  await setGlobalAudioEnabled(enabled)
  if (!enabled) {
    await stopAll()
  }
  return enabledCache
}

export const toggleSoundPreference = async () => {
  const current = cacheLoaded ? enabledCache : await ensureSoundPreferenceLoaded()
  return setSoundPreference(!current)
}

export const stopAll = async () => {
  pendingKey = null
  await stopCurrentSound()
}

export const stopIfKey = async (key) => {
  if (currentKey !== key && pendingKey !== key) return
  if (pendingKey === key) pendingKey = null
  if (currentKey === key) {
    await stopCurrentSound()
  }
}

export const playMusic = async (key, asset) => {
  const enabled = cacheLoaded ? enabledCache : await ensureSoundPreferenceLoaded()
  if (!enabled) {
    await stopAll()
    return
  }
  if (currentKey === key && currentSound) {
    try {
      await currentSound.playAsync()
    } catch (error) {
      console.log('audio resume error', error)
    }
    return
  }

  pendingKey = key
  await stopCurrentSound()

  try {
    const { sound } = await Audio.Sound.createAsync(asset, {
      isLooping: true,
      shouldPlay: true
    })
    if (!enabledCache || pendingKey !== key) {
      await sound.unloadAsync()
      return
    }
    currentSound = sound
    currentKey = key
    pendingKey = null
  } catch (error) {
    console.log('audio play error', error)
  }
}
