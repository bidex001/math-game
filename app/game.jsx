import { View, Text,Animated,Easing, TouchableOpacity,ImageBackground,Image,Dimensions, DevSettings } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState,useEffect,useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle } from 'react-native-svg'
import * as Updates from 'expo-updates'
import { router, useLocalSearchParams } from 'expo-router'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from 'expo-av';


// await Updates.reloadAsync()

const HIGH_SCORE_KEY = 'highScore'

const DIFFICULTY_CONFIG = {
    easy: { seconds: 20, ops: ["+","-"] },
    medium: { seconds: 12, ops: ["+","-","x"] },
    hard: { seconds: 7, ops: ["+","-","x","/"] }
}

const normalizeDifficulty = (value) => {
    if (typeof value !== 'string') return 'easy'
    const key = value.toLowerCase()
    return DIFFICULTY_CONFIG[key] ? key : 'easy'
}

const Game = () => {
    const { difficulty: difficultyParam } = useLocalSearchParams()
    const difficultyKey = normalizeDifficulty(difficultyParam)
    const difficulty = DIFFICULTY_CONFIG[difficultyKey]
    const roundSeconds = difficulty.seconds

    const [playerScore, setPlayerScore] = useState(0);
    const [computerScore, setComputerScore] = useState(0);
    const[timer,setTimer] = useState(roundSeconds);
    const [gameOver,setGameOver] = useState(false)
    const [selectedAnser,setSelectedAnser] = useState(null)
    const [wasCorrect,setWasCorrect] = useState(false)
    const [end,setEnd] = useState(false)
    const {width} = Dimensions.get('window')
    const hardUnlocked = playerScore >= 5
    const [question,setQuestion] = useState({
        a:0,
        b:0,
        op:"+",
        answer:0,
        options:[]
    })

    useEffect(() => {
        const saveHighScore = async () => {
            try {
                const stored = await AsyncStorage.getItem(HIGH_SCORE_KEY)
                const storedScore = stored ? Number(stored) : 0
                const safeStoredScore = Number.isFinite(storedScore) ? storedScore : 0
                if (playerScore > safeStoredScore) {
                    await AsyncStorage.setItem(HIGH_SCORE_KEY, String(playerScore))
                }
            } catch (e) {
                console.log('Failed to save high score', e)
            }
        }

        saveHighScore()
    }, [playerScore])

    const getRandomInt = (min,max) =>{
        return Math.floor(Math.random()*(max - min + 1)) + min
    }

    function buildQuestion(){
        const ops = difficulty.ops
        const op = ops[getRandomInt(0,ops.length - 1)]
        let a = getRandomInt(2,20)
        let b = getRandomInt(2,20)
        let answer = 0

        if(op === "/"){
            b = getRandomInt(2,12)
            answer = getRandomInt(2,12)
            a = b * answer
        }else{
            if(op === "-" && b > a){
                const temp = a
                a = b
                b = temp
            }
            if(op === "+") answer = a + b
            if(op === "-") answer = a - b
            if(op === "x") answer = a * b
        }
        
        
        const optionSet = new Set([answer])
        while (optionSet.size < 4){
            const delta = getRandomInt(-10,10)
            const candidate = answer + delta
            if (candidate >= 0) optionSet.add(candidate)
        }

        const options = Array.from(optionSet)
        for (let i = options.length - 1; i > 0; i -= 1){
            const j = getRandomInt(0,i)
            const temp = options[i]
            options[i] = options[j]
            options[j] = temp
        }
        setQuestion({a,b,op,answer,options})
    }

    useEffect(()=>{
        setTimer(roundSeconds)
        buildQuestion()
    },[roundSeconds])

function handleAnswer(value) {
  if (selectedAnser !== null || gameOver) return
  setSelectedAnser(value)
  const correct = value === question.answer
  setWasCorrect(correct)
  if (correct) setPlayerScore((s) => s + 1)
  else setComputerScore((s) => s + 1)
  setGameOver(true)
}


    const radius = 68
    const circumference = 2 * Math.PI * radius
    const segment = 8
    const gap = 4
    const dash = circumference / segment - gap
    const step = dash + gap

    const color = [
        'skyblue','skyblue','skyblue','skyblue',
         'orange','orange',
        'white','white'
    ]

    const spin = useRef(new Animated.Value(0)).current;


    const spinInterpolate = spin.interpolate({
        inputRange:[0,1],
        outputRange:['0deg','360deg']
    })

    useEffect(()=>{
        if (gameOver || selectedAnser !== null) return
        const id = setInterval(()=>{
            setTimer((t)=>{
                if(t <= 1){
                    if(selectedAnser === question.answer){
                        setPlayerScore((s)=> s + 1)
                    }else{
                        setComputerScore((s)=> s + 1)
                    }
                    setGameOver(true)
                    return 0
                }
                return t - 1
            })
        },1000)
        return ()=> clearInterval(id)
    },[gameOver,selectedAnser,question.answer])

    function handleRestart(){
        if(!gameOver) return
        setGameOver(false)
        setTimer(roundSeconds)
        setSelectedAnser(null)
        buildQuestion()
        startSpin()
        setWasCorrect(false)
    }

    const handlePlayAgain = async () => {
        try {
            if (Updates.isEnabled) {
                await Updates.reloadAsync()
                return
            }
        } catch (e) {
            console.log('Reload failed', e)
        }

        if (DevSettings && typeof DevSettings.reload === 'function') {
            DevSettings.reload()
            return
        }

        // Final fallback if reload isn't available (e.g., web): reset state
        setEnd(false)
        setPlayerScore(0)
        setComputerScore(0)
        setTimer(roundSeconds)
        setGameOver(false)
        setSelectedAnser(null)
        setWasCorrect(false)
        buildQuestion()
    }



    function startSpin(){
        spin.setValue(0)
        Animated.timing(spin,{
            toValue:1,
            duration:roundSeconds * 1000,
            easing :Easing.linear,
            useNativeDriver:true
        }).start()
    }

    const spinLoop = useRef(null)

useEffect(() => {
  spinLoop.current = Animated.loop(
    Animated.timing(spin, {
      toValue: 1,
      duration: 6000,
      easing: Easing.linear,
      useNativeDriver: true
    })
  )
  spinLoop.current.start()

  return () => spinLoop.current?.stop()
}, [spin])

useEffect(() => {
  if (gameOver) spinLoop.current?.stop()
}, [gameOver])

useEffect(() => {
  if ( !wasCorrect) return

  const id = setTimeout(() => {
    handleRestart() // or handleSpinClick
  }, 5000)

  return () => clearTimeout(id)
}, [ wasCorrect])


const gameMusicRef = useRef(null);
const endMusicRef = useRef(null);

const startGameMusic = async () => {
  if (gameMusicRef.current) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sound/music2.mp3'),
      { isLooping: true, shouldPlay: true }
    );
    gameMusicRef.current = sound;
  } catch (e) {
    console.log('Game music error', e);
  }
};

const startEndMusic = async () => {
  if (endMusicRef.current) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sound/music3.mp3'),
      { isLooping: true, shouldPlay: true }
    );
    endMusicRef.current = sound;
  } catch (e) {
    console.log('End music error', e);
  }
};

useEffect(() => {
  startGameMusic();
  return () => {
    gameMusicRef.current?.unloadAsync();
    gameMusicRef.current = null;
    endMusicRef.current?.unloadAsync();
    endMusicRef.current = null;
  };
}, []);

useEffect(() => {
  if (end) {
    gameMusicRef.current?.stopAsync();
    startEndMusic();
  } else {
    endMusicRef.current?.stopAsync();
  }
}, [end]);




 
  return (
    <ImageBackground
    source={require('../assets/images/back2.jpeg')}
    resizeMode='cover'
    style={{flex:1,width:'100%'}}
    >
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', alignItems: 'center' ,padding:25}}>
        <View style={{display:'flex',width:'100%',justifyContent:'center',alignItems:'center',gap:25}}>
        <View style={{display:'flex',flexDirection:'row',justifyContent:'space-between',width:"80%"}}>
            <LinearGradient
            colors={['#87CEEB', 'blue']} // start to end color
            start={{ x: 1, y: 0 }}         // top-left
            end={{ x: 1, y: 1 }} 
            style={{overflow:'hidden',borderRadius:5,paddingHorizontal:20,paddingVertical:5,}} 
            >
                <Text style={{color:"white",fontSize:20,fontWeight:"700",fontFamily:'montserrat',textTransform:'capitalize'}}>win : {playerScore}</Text>
            </LinearGradient>

            <LinearGradient
            colors={['#FFD580', '#FF7F00']} // start to end color
            start={{ x: 1, y: 0 }}         // top-left
            end={{ x: 1, y: 1 }} 
            style={{overflow:'hidden',borderRadius:5,paddingHorizontal:20,paddingVertical:5,}} 
            >
                <Text style={{color:"white",fontSize:20,fontWeight:"700",fontFamily:'montserrat',textTransform:'capitalize'}}>lose : {computerScore}</Text>
            </LinearGradient>
        </View>

         <TouchableOpacity
        onPress={handleRestart}
        disabled={!gameOver}
        activeOpacity={0.8}
       style={{width:160,height:160,justifyContent:'center',alignItems:'center'}}>
            <Animated.View style={{transform:[{rotate:spinInterpolate}],position:'absolute'}}>
                <Svg width={160} height={160} style={{}}>
                <Circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="blue"
                />
                {
                    color.map((color,index)=>{
                        return <Circle
                            key={index}
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke={color}
                            strokeWidth="15"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-index * step}
                            strokeLinecap='butt'
                            fill={"none"}
                            rotation={-90}
                            origin="80, 80"
                        />
                    })
                }
            </Svg>
            </Animated.View>
            <Text style={{ fontFamily:'FredokaOne_400Regular',color:"white",fontSize:40,fontWeight:"700"}}>{gameOver?"start":timer}</Text>
        </TouchableOpacity>

        <View style={{width:"80%",backgroundColor:'white',display:'flex',flexDirection:'row', gap:5,justifyContent:'center',padding:8,borderRadius:5}}>
            <Text style={{fontFamily:'  ComicNeue_700Bold',fontSize:25,}}>{question.a} {question.op} {question.b} =</Text>
        </View>

        <View style={{display:'flex',width:'80%',flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:15}}>
            {
                question.options.map((value,index)=>{
                    return(
                        <TouchableOpacity key={`${value}-${index}`}
                        onPress={()=> handleAnswer(value)}
                        disabled={selectedAnser !== null}
                        activeOpacity={0.8}
                        style={{backgroundColor:selectedAnser === value?'orange':'#F8F8F8',width:'48%',paddingVertical:12,borderRadius:8,alignItems:'center',fontFamily:'FredokaOne_400Regular',fontWeight:800,fontSize:12}}>
                            <Text>{value}</Text>
                        </TouchableOpacity>
                    )
                })
            }
        </View>
       </View>

        <TouchableOpacity>
            <LinearGradient
            colors={['#9ACD32', 'green']} // start to end color
            start={{ x: 1, y: 0 }}         // top-left
            end={{ x: 1, y: 1 }}
            style={{backgroundColor:"black",paddingHorizontal:30,paddingVertical:10,borderRadius:20,boxShadowColor:'black',boxShadowOffset:{width:0,height:10},boxShadowOpacity:0.5,boxShadowRadius:10,}} >
                <TouchableOpacity 
                onPress={()=>{
                    setEnd(true)
                }}>
                    <Text style={{color:"white",textTransform:'uppercase',fontFamily:'Poppins_700Bold',fontSize:25,letterSpacing:2}}>end game</Text>
                </TouchableOpacity>
            </LinearGradient>
        </TouchableOpacity>


       {/* correct answer model */}

        {
            selectedAnser === question.answer && (
                <ImageBackground
                source={require('../assets/images/back3.jpeg')}
                resizeMode='cover'
                style={{zIndex:1000,position:'absolute',top:0,left:0,right:0,bottom:0,justifyContent:'center',alignItems:'center',}}>
                    <View style={{display:'flex',justifyContent:'center',alignItems:'center', gap:5}} >
                    <LinearGradient
                    colors={['#9ACD32', 'green']} // start to end color
                    start={{ x: 1, y: 0 }}         // top-left
                    end={{ x: 1, y: 1 }}
                    style={{display:'flex',justifyContent:'center',alignItems:'center',borderRadius:'100%',width:120,height:120,borderWidth:5,borderColor:'white',overflow:'hidden'}}>
                        <Image source={require("../assets/images/check3.png")} style={{width:150,height:100}}/>
                    </LinearGradient>

                    <LinearGradient
                    colors={['#F0FFF0', '#98FF98']} // start to end color
                    start={{ x: 1, y: 0 }}         // top-left
                    end={{ x: 1, y: 1 }}
                    style={{display:'flex', height:100,width: width * 0.8,justifyContent:'center',alignItems:'center',gap:5,borderRadius:5}}
                    >
                        <Text style={{fontFamily:'Poppins_700Bold',color:'green',fontSize:40}}>correct!</Text>
                        <Text style={{fontFamily:'Poppins_700Bold',color:'green',fontSize:20}}>{question.a} {question.op} {question.b} = {question.answer}</Text>
                    </LinearGradient>

                    <Text style={{ color:'white',fontSize:25,fontFamily:'Montserrat_700Bold',textTransform:'capitalize',marginTop:15}}>great job!</Text>
                  </View>
                </ImageBackground>
            )
        }

        {
            end && (
                <ImageBackground
                source={require('../assets/images/back4.jpeg')}
                resizeMode='cover'
                style={{zIndex:1000,position:'absolute',top:0,left:0,right:0,bottom:0,justifyContent:'start',alignItems:'center',paddingVertical:100,gap:40}}>
                    <Text style={{fontFamily:'Poppins_700Bold',textTransform:'uppercase',color:'white',fontWeight:700,fontSize:50,letterSpacing:2}}>{computerScore > playerScore?"you lose!":"you win!"}</Text>
                    <View style={{display:'flex',gap:10,justifyContent:'center',alignItems:'center'}}>
                        <LinearGradient
                        colors={['#F0F8FF', '#B0E0E6']} // start to end color
                        start={{ x: 1, y: 0 }}         // top-left
                        end={{ x: 1, y: 1 }}
                         style={{display:'flex',justifyContent:'center',borderRadius:5,alignItems:'center',width: width * 0.8,padding:10}}>
                            <Text style={{fontSize:20,textTransform:'capitalize',color:'#0000CD',fontFamily:'Poppins_400Regular'}}>your score : {playerScore}</Text>
                        </LinearGradient>

                       <LinearGradient
                        colors={['#F0F8FF', '#B0E0E6']} // start to end color
                        start={{ x: 1, y: 0 }}         // top-left
                        end={{ x: 1, y: 1 }}
                         style={{display:'flex',justifyContent:'center',alignItems:'center',width: width * 0.8,padding:10}}>
                            <Text style={{fontSize:20,textTransform:'capitalize',borderRadius:5,color:'#0000CD',fontFamily:'Poppins_400Regular'}}>computer score : {computerScore}</Text>
                        </LinearGradient>
                    </View>

                    <View style={{display:'flex',gap:10,justifyContent:'center',alignItems:'center'}}>
                        <LinearGradient
                        colors={['#0000CD', '#00008B']} // start to end color
                        start={{ x: 1, y: 0 }}         // top-left
                        end={{ x: 1, y: 1 }}
                        >
                            <TouchableOpacity 
                            onPress={handlePlayAgain}
                              style={{display:'flex',justifyContent:'center',borderRadius:5,alignItems:'center',width: width * 0.8,padding:10}}>
                            <Text style={{fontSize:20,textTransform:'capitalize',borderRadius:5,color:'white',fontFamily:'Montserrat_700Bold'}}>play again</Text>
                        </TouchableOpacity>
                        </LinearGradient>

                         <LinearGradient
                        colors={['#808080', '#696969']} // start to end color
                        start={{ x: 1, y: 0 }}         // top-left
                        end={{ x: 1, y: 1 }}
                        >
                            <TouchableOpacity
                            onPress={() => {
                                const params = hardUnlocked ? { hardUnlocked: "1" } : {}
                                router.push({ pathname: "/", params })
                            }}
                              style={{display:'flex',justifyContent:'center',borderRadius:5,alignItems:'center',width: width * 0.8,padding:10}}>
                            <Text style={{fontSize:20,textTransform:'capitalize',borderRadius:5,color:'white',fontFamily:'Montserrat_700Bold'}}>home</Text>
                        </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </ImageBackground>
            )
        }
    </SafeAreaView>
    </ImageBackground>
  )
}

export default Game
