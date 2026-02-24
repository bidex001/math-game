import { View, Text,TouchableOpacity,Image,Animated,ImageBackground } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { useRef,useEffect, useState, useCallback } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';


const HIGH_SCORE_KEY = 'highScore'

const Index = () => {
    const scale = useRef(new Animated.Value(1)).current;
    const speedUp = useRef(new Animated.Value(0)).current;
    const { hardUnlocked: hardUnlockedParam } = useLocalSearchParams();
    const [difficulty, setDifficulty] = useState('easy');
    const [hardUnlocked, setHardUnlocked] = useState(false);
    const [highScore, setHighScore] = useState(0);

    const speedUpScale = speedUp.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1],
    });

    const triggerSpeedUp = () => {
      speedUp.setValue(0);
      Animated.sequence([
        Animated.timing(speedUp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(350),
        Animated.timing(speedUp, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    };

    const handleSelectDifficulty = (level) => {
      setDifficulty(level);
      if (level !== 'easy') triggerSpeedUp();
    };

    useEffect(() => {
  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 600, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 600, useNativeDriver: true }),
    ])
  );
  loop.start();
  return () => loop.stop();
}, [scale]);

useEffect(() => {
  if (hardUnlockedParam === '1') setHardUnlocked(true);
}, [hardUnlockedParam]);

useFocusEffect(
  useCallback(() => {
    const loadHighScore = async () => {
      try {
        const stored = await AsyncStorage.getItem(HIGH_SCORE_KEY)
        const storedScore = stored ? Number(stored) : 0
        setHighScore(Number.isFinite(storedScore) ? storedScore : 0)
      } catch (e) {
        console.log('Failed to load high score', e)
      }
    }

    loadHighScore()
  }, [])
);


const indexMusic = useRef(null)
async function startMusic(){
  if(indexMusic.current) return;
  try {
    const {sound} = await Audio.Sound.createAsync(
      require('../assets/sound/music1.mp3'),
      {isLooping:true,shouldPlay:true}
    )
    indexMusic.current = sound
  } catch (error) {
    console.log('index music error',error)
  }
}

useEffect(()=>{
  startMusic()
  return ()=>{
    indexMusic.current?.unloadAsync()
    indexMusic.current = null
  }
},[])




  return (
    <ImageBackground
    source={require('../assets/images/background.png')}
    resizeMode='cover'
    style={{flex:1,width:'100%'}}>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
     <View style={{flex:1,justifyContent:'start',alignItems:'center',width:"100%",gap:50,marginTop:70}}>
         <View style={{justifyContent:"center",display:'flex',flexDirection:'column',alignItems:'center',position:'relative',marginBottom:10}}>
        <Image source={require('../assets/images/brain.png')} style={{width:80,height:80}} />
        <Text style={{fontSize:40,fontWeight:"900", fontFamily:"FredokaOne_400Regular",color:"white",position:'absolute',textTransform:"uppercase",textShadowColor:'blue',textShadowRadius: 5,textShadowOffset: { width: 3, height: 3},top:45}}>math</Text>
        <Text style={{fontSize:50,fontWeight:"900", fontFamily:"",color:"yellow",textTransform:"uppercase",textShadowColor:'blue',textShadowRadius: 5,textShadowOffset: { width: 3, height: 3},position:'absolute',top:65}}>battle</Text>
      </View>

      <Text style={{fontSize:20,fontWeight:"700", fontFamily:"Poppins_400Regular",color:"white",textTransform:'capitalize',letterSpacing:2,fontStyle:'italic'}}>challenge the computer</Text>

      <View style={{alignItems:'center',gap:8,width:'100%'}}>
      <View style={{display:'flex',flexDirection:'row',width:"80%",justifyContent:'space-between'}}>
        <LinearGradient
         colors={['#9ACD32', 'green']} // start to end color
         start={{ x: 1, y: 0 }}         // top-left
         end={{ x: 1, y: 1 }}  
         style={[
          {overflow:'hidden',borderRadius:10,paddingHorizontal:30,paddingVertical:10,},
          difficulty === 'easy' && { borderWidth: 2, borderColor: 'white' }
        ]}
         >
          <TouchableOpacity
          onPress={() => handleSelectDifficulty('easy')}
          activeOpacity={0.8}
          style={{}}>
            <Text style={{color:"white",textTransform:'capitalize',fontFamily:'Poppins_700Bold',fontStyle:'italic'}}>easy</Text>
        </TouchableOpacity>
        </LinearGradient>

         <LinearGradient
         colors={['pink', '#FF69B4']} // start to end color
         start={{ x: 1, y: 0 }}         // top-left
         end={{ x: 1, y: 1 }}  
         style={[
          {overflow:'hidden',borderRadius:10,paddingHorizontal:30,paddingVertical:10,},
          difficulty === 'medium' && { borderWidth: 2, borderColor: 'white' }
        ]}
         >
          <TouchableOpacity
          onPress={() => handleSelectDifficulty('medium')}
          activeOpacity={0.8}
          style={{}}>
            <Text style={{color:"white",textTransform:'capitalize',fontFamily:'Poppins_700Bold',fontStyle:'italic'}}>medium</Text>
        </TouchableOpacity>
        </LinearGradient>

         <LinearGradient
         colors={['#FFD580', '#FF7F00']} // start to end color
         start={{ x: 1, y: 0 }}         // top-left
         end={{ x: 1, y: 1 }}  
         style={[
          {overflow:'hidden',borderRadius:10,paddingHorizontal:30,paddingVertical:10,},
          difficulty === 'hard' && { borderWidth: 2, borderColor: 'white' }
        ]}
         >
          <TouchableOpacity
          onPress={() => handleSelectDifficulty('hard')}
          activeOpacity={0.8}
          style={{}}>
            <Text style={{color:"white",textTransform:'capitalize',fontFamily:'Poppins_700Bold',fontStyle:'italic'}}>hard</Text>
        </TouchableOpacity>
        </LinearGradient>
          
      </View>

      <Animated.Text
      style={{
        opacity: speedUp,
        transform: [{ scale: speedUpScale }],
        color: 'yellow',
        fontFamily: 'Poppins_700Bold',
        fontStyle: 'italic',
        marginTop: 8
      }}
      >
        Speed Up!
      </Animated.Text>

      {
        !hardUnlocked && (
          <Text style={{color:'white',fontFamily:'Poppins_400Regular',fontSize:14,marginTop:4,opacity:0.9}}>
            get 5 correct answers to unlock hard
          </Text>
        )
      }
      </View>

      <Animated.View style={{ transform: [{ scale }] }}>
        <Link href={{ pathname: "/game", params: { difficulty } }}>
        <LinearGradient
       colors={['#9ACD32', 'green']} // start to end color
        start={{ x: 1, y: 0 }}         // top-left
        end={{ x: 1, y: 1 }}  
       style={{backgroundColor:"black",paddingHorizontal:30,paddingVertical:10,borderRadius:20,boxShadowColor:'black',boxShadowOffset:{width:0,height:10},boxShadowOpacity:0.5,boxShadowRadius:10,}}>
        <Text style={{color:"white",textTransform:'uppercase',fontFamily:'Poppins_700Bold',fontSize:25,letterSpacing:2}}>start game</Text>
      </LinearGradient>
        </Link>
      </Animated.View>
     </View>

      <LinearGradient
       colors={['#87CEEB', 'white','white','#87CEEB']} // start to end color
        start={{ x: 1, y: 1 }}         // top-left
        end={{ x: 0, y:0 }}  
        style={{display:'flex',gap:10,justifyContent:'center',width:"100%",alignItems:'center',flexDirection:'row',padding:5,marginBottom:50}}>
        <Image source={require('../assets/images/cup.png')} style={{width:50,height:50}} />
        <Text style={{fontSize:20,textTransform:'capitalize',fontFamily:'Poppins_400Regular',color:"black",fontWeight:"500",fontStyle:'italic'}}>high score:</Text>
        <Text style={{fontSize:20,fontWeight:"800",fontFamily:'FredokaOne_400Regular',color:"black",letterSpacing:1}}>{highScore}</Text>
      </LinearGradient>
    </SafeAreaView>
    </ImageBackground>
  )
}

export default Index
