
const youtubeBuffers = [  ]

const audioContext = new (window.AudioContext || window.webkitAudioContext)();



const playButton = document.getElementById( 'play-btn' )
const stopButton = document.getElementById( 'stop-all-btn' )
const modal = document.getElementById( 'modal' )
const modalBack = document.getElementById( 'modal-back' )
const contentArea = document.getElementById( 'content-area' )

const loopButton = document.getElementById( 'loop-btn' )

loopButton.addEventListener( 'click', () => {
    if( !lastPadSelected.loop) {
        lastPadSelected.setLoop( true )
    }else{
        lastPadSelected.setLoop( false ) 
    }
} )


let wavesurfer                  = null;    // WaveSurfer instance
let currentRegion               = null;  // Current WaveSurfer region
let currentWaveformUrl          = null;    // Current waveform URL



let isFileModalOpen             = false;
let lastPadSelected             = false;

let isShift                     = false;




function modalToggle( state ){
    if ( state ) {
        generateTriggers( )
        modal.style.display = 'block';
        modalBack.style.display = 'block';
    }else{
        modal.style.display = 'none';
        modalBack.style.display = 'none';
    }

}



modalBack.addEventListener('click', (e) => {
    modalToggle( false )
})


// Data needed for Playback of an audio
class Trigger {
    constructor( buffer ){
        this.buffer_full        = buffer;
        this.region             = null;
        this.regionObj;
        this.buffer_sample      = buffer;
    }

}

// All Data for Audio Source
class AudioSource {
    constructor( youtubeID, metadata, buffer ){
        this.ID                 = youtubeID;
        this.title              = metadata.title;
        this.thumbnail          = metadata.thumbnail;
        this.buffer             = buffer;
        this.trigger            = new Trigger( this.buffer )
    }

    duplicateAudioSource( ){
        let newAudioSource = new AudioSource( this.ID, { title: this.title, thumbnail: this.thumbnail }, this.buffer )
        return newAudioSource
    }
}

// Data for the GUI Pad
class Pad {
    constructor( id ){
        this.id                 = id;
        this.domElement         = document.getElementById( `pad${this.id}` );
        this.shiftDomElement    = document.getElementById( `pad0_shift`);
        this.playbackSpeed      = 1;
        this.loop               = false;
        this.trigger;
        this.thumbnail;
        this.title;
    }

    setElement( AudioSource ){
        this.trigger = AudioSource.trigger;
        this.thumbnail = AudioSource.thumbnail;
        this.title = AudioSource.title;

        console.log(
            this.domElement, this.shiftDomElement
        )

        this.domElement.style.backgroundImage = `url(${this.thumbnail})`;
        this.domElement.style.backgroundSize = 'cover';   // Optional: Makes the image cover the entire div
        this.domElement.style.backgroundPosition = 'center'; // Optional: Centers the background image
        this.domElement.style.backgroundRepeat = 'no-repeat'; // Optional: Prevents the image from repeating
        
        console.log(this.shiftDomElement)
        this.shiftDomElement.style.backgroundImage = `url(${this.thumbnail})`;
        this.shiftDomElement.style.backgroundSize = 'cover';   // Optional: Makes the image cover the entire div
        this.shiftDomElement.style.backgroundPosition = 'center'; // Optional: Centers the background image
        this.shiftDomElement.style.backgroundRepeat = 'no-repeat'; // Optional: Prevents the image from repeating
    }

    setLoop( state ){
        this.loop = state
        toggleLoopButton(this)
    }


}



class Sequence {
    constructor(){
        this.values;
    }
}

class Sampler {
    constructor(){
        this.isPlaying;
        this.audiosPlaying      = {};
        this.padsPlaying        = {};
        this.AudioSources       = [];
        this.ASIDSearch         = {};
        this.ASTitleSearch      = {};

        this.currentPad         = null;

        this.pad_0              = new Pad(0);
        this.pad_1              = new Pad(1);
        this.pad_2              = new Pad(2);
        this.pad_3              = new Pad(3);
        this.pad_4              = new Pad(4);
        this.pad_5              = new Pad(5);
        this.pad_6              = new Pad(6);
        this.pad_7              = new Pad(7);
        this.pad_8              = new Pad(8);
        this.pad_9              = new Pad(9);
        this.pad_10             = new Pad(10);
        this.pad_11             = new Pad(11);
        this.pad_12             = new Pad(12);
        this.pad_13             = new Pad(13);
        this.pad_14             = new Pad(14);
        this.pad_15             = new Pad(15);

        this.padArray           = [];
        this.keyTriggers        = [];


        this.sequences;

        this.init()

    }

    init(){

        let pads = document.getElementsByClassName('regular')

        pads = [].slice().slice.call(pads);
        pads.forEach((element, i) => {
            element.id = `pad${i}`;
            element.dataset.id = i
            element.addEventListener( 'mousedown', (e) => {
                const pad = SAMPLER.padArray[element.dataset.id];
                lastPadSelected = pad;
                if( !pad.trigger ) {
                    modalToggle( true )
                    return
                };
                SAMPLER.setCurrentPad( pad )
                playAudio( pad )

            } )
        });
        let keyTrigger_Keys = [
            "Digit1",
            "Digit2",
            "Digit3",
            "Digit4",
            "KeyQ",
            "KeyW",
            "KeyE",
            "KeyR",
            "KeyA",
            "KeyS",
            "KeyD",
            "KeyF",
            "KeyZ",
            "KeyX",
            "KeyC",
            "KeyV",
        ]

        for( let i = 0 ; i < 16; i++ ){
            this.padArray.push(this[`pad_${i}`]);
            this.keyTriggers[keyTrigger_Keys[i]] = this[`pad_${i}`]
        };

        
        this.setPlaying( false )

        console.log(this.keyTriggers)
    }

    setPlaying( state ){
        if(state){
            playButton.classList.add( 'disable' )
            stopButton.classList.remove( 'disable' )
        }else{
            stopButton.classList.add( 'disable' )
            playButton.classList.remove( 'disable' )
        }
        this.isPlaying = state
    }


    setRegion(){
        wavesurfer.clearRegions();
        if (this.currentPad.trigger.region) {
            currentRegion = this.currentPad.trigger.regionObj
            wavesurfer.addRegion(currentRegion);
        }
    }

    setCurrentPad( pad ){
        lastPadSelected = pad
        this.currentPad = pad;
        if(!pad.trigger) return
        this.setRegion() 
    }

    setShift( state ){
        isShift = state;
        const regularPads = document.getElementsByClassName( "regular" )
        const shiftPads = document.getElementsByClassName( "shift" )

        let reg = 'add'
        let shift = 'remove'

        if( !isShift ){
            [reg, shift] = [shift, reg]
        }

        console.log(reg,
            shift)
        for (let i = 0 ; i < regularPads.length ; i++){
            regularPads.item(i).classList[reg]('disable')
            shiftPads.item(i).classList[shift]('disable')
        }
        
    }
}

function stopPlayerIfPlaying(){
    if(Object.keys(SAMPLER.audiosPlaying).length ) return
    if(SAMPLER.isPlaying) SAMPLER.setPlaying( false )
}

function endPlayer () {
    Object.keys( SAMPLER.audiosPlaying ).forEach( (key) => {
        if(SAMPLER.audiosPlaying[key]){
            SAMPLER.audiosPlaying[key].disconnect()
            if(SAMPLER.padsPlaying[key].interval){
                clearInterval(SAMPLER.padsPlaying[key].interval)
            }
        }else{
            // source.stop();     
            // source.disconnect(); 
        }
        delete SAMPLER.audiosPlaying[key]
        delete SAMPLER.padsPlaying[key]
    } )
    stopPlayerIfPlaying()
}

function startPlayer ( ) {
    if(!Object.keys(SAMPLER.audiosPlaying).length ) return
    if(!SAMPLER.isPlaying) SAMPLER.setPlaying( true )
}

function toggleLoopButton(pad){

    if(pad.loop){
        if(!loopButton.classList.contains( 'on' )){
            loopButton.classList.add( 'on' )
        }
    }else{
        if(pad.interval)clearInterval(pad.interval)
        if(loopButton.classList.contains( 'on' )){
            loopButton.classList.remove( 'on' )
        }
    }
}

function playAudio( pad ) {
    if(!pad.trigger) return
    wavesurfer.loadDecodedBuffer(pad.trigger.buffer_full);

    toggleLoopButton(pad)

    // wavesurfer.play();   // Play

    const audioBuffer = pad.trigger.buffer_sample

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    const saveKey = Math.random()
    SAMPLER.audiosPlaying[ saveKey ] = source
    SAMPLER.padsPlaying[ saveKey ] = pad
    startPlayer()
    source.start();
    source.onended = () => {
        source.stop();     // stops playback
        source.disconnect(); // optional, cleans up connection  
        if(SAMPLER.audiosPlaying[ saveKey ]) {
            delete SAMPLER.audiosPlaying[ saveKey ]
            delete SAMPLER.padsPlaying[ saveKey ]
        }
        stopPlayerIfPlaying()
    }
    if(pad.loop){
        console.log('loop', audioBuffer.duration * 1000)
        if(lastPadSelected.interval){
            clearInterval(lastPadSelected.interval)
        }
        const interval = setInterval(() => {
            console.log('yoo')
            const source = audioContext.createBufferSource();
            
            source.buffer = audioBuffer;
        
            source.connect(audioContext.destination);
        
            const saveKey = Math.random()
            SAMPLER.audiosPlaying[ saveKey ] = source
            SAMPLER.padsPlaying[ saveKey ] = pad


            startPlayer()
        
            source.start();
            source.onended = () => {
                source.stop();     // stops playback
                source.disconnect(); // optional, cleans up connection  
                if(SAMPLER.audiosPlaying[ saveKey ]) {
                    delete SAMPLER.audiosPlaying[ saveKey ]
                    delete SAMPLER.padsPlaying[ saveKey ]
                }
                stopPlayerIfPlaying()
            }
        
        }, audioBuffer.duration * 1000 )
        lastPadSelected.interval = interval
    }
}





const SAMPLER = new Sampler()


function checkAudioSourcesLength(){
    return SAMPLER.AudioSources.length
}

function addNewTrigger() {

    if(lastPadSelected){
        lastPadSelected.setElement( SAMPLER.AudioSources[ SAMPLER.AudioSources.length -1 ] );
    }

}


function generateTriggers() {

    if(!SAMPLER.AudioSources.length) return

    contentArea.innerHTML = "";

    SAMPLER.AudioSources.forEach( ( AS ) => {
  
        const div = document.createElement("div");
        div.classList.add('pad_list')
        div.style.backgroundImage = `url(${AS.thumbnail})`;
        div.style.backgroundSize = 'cover';   // Optional: Makes the image cover the entire div
        div.style.backgroundPosition = 'center'; // Optional: Centers the background image
        div.style.backgroundRepeat = 'no-repeat'; // Optional: Prevents the image from repeating

        if(lastPadSelected){
            div.addEventListener( 'click', ( e ) => {
                const newAS = AS.duplicateAudioSource()
                console.log(newAS)
                lastPadSelected.setElement( newAS )
                SAMPLER.setCurrentPad( lastPadSelected )
                modalToggle( false )
            } )
        }
        contentArea.appendChild(div);

    })

  }
  


  document.addEventListener( 'keydown', (e) => {

    if(SAMPLER.keyTriggers[e.code]){
        SAMPLER.setCurrentPad(SAMPLER.keyTriggers[e.code])
        playAudio( SAMPLER.keyTriggers[e.code] )
        return 
    }

    switch(e.code){
        case 'Space':
            if(SAMPLER.isPlaying){
                endPlayer()
            }else{
                playAudio(lastPadSelected)
                startPlayer()
            }
            break;
        case 'KeyL':
            if(lastPadSelected?.trigger){
                if( !lastPadSelected.loop) {
                    lastPadSelected.setLoop( true )
                }else{
                    lastPadSelected.setLoop( false ) 
                }
            }
            break;
        case 'ShiftLeft':
            isShift = true
            SAMPLER.setShift( true )

    }
  } )

  document.addEventListener( 'keyup', (e) => {

    // if(e.code == 'ShiftLeft' || e.code ==  "ShiftRight"){
    //     e.code = "Shift"
    // }
    switch(e.code){
        case "ShiftLeft":
            isShift = true
            SAMPLER.setShift( false )



    }
  } )




  stopButton.addEventListener( 'mousedown', (e) => {
    endPlayer()

  } )

  playButton.addEventListener( 'mousedown', (e) => {
    startPlayer()
  } )




  function trimAudioBuffer(originalBuffer, start, end) {
    // Ensure that the start and end times are within the bounds of the audio buffer
    start = Math.max(0, start);  // Ensure start is not less than 0
    end = Math.min(originalBuffer.duration, end);  // Ensure end is not beyond the original duration

    // Calculate the number of samples to copy based on the start and end times
    const startSample = Math.floor(start * originalBuffer.sampleRate);
    const endSample = Math.floor(end * originalBuffer.sampleRate);
    const numSamples = endSample - startSample;

    // Create a new AudioBuffer with the trimmed sample data
    const trimmedBuffer = audioContext.createBuffer(
        originalBuffer.numberOfChannels,
        numSamples,
        originalBuffer.sampleRate
    );

    // Copy the relevant portion of each channel from the original buffer to the new buffer
    for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const channelData = originalBuffer.getChannelData(channel).slice(startSample, endSample);
        trimmedBuffer.copyToChannel(channelData, channel);
    }

    return trimmedBuffer;
}





// ================================
// 3. WaveSurfer Initialization & Region Handling
// ================================




function updateAssignedRegion(region) {
    currentRegion = region
    SAMPLER.currentPad.trigger.regionObj = region
    SAMPLER.currentPad.trigger.region = { start: region.start, end: region.end };
  }
  

document.addEventListener('DOMContentLoaded', () => {
    wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor: '#d9dcff',
      progressColor: '#4353ff',
      backend: 'WebAudio',
      interact: false,// disables seeking and playhead movement
      plugins: [
        
        WaveSurfer.regions.create({ 
            dragSelection: {
                slop: 5,
              },
         })
      ],
      scrollParent: true,
      minPxPerSec: 50
    });

    wavesurfer.on('region-created', region => {
        if (currentRegion) {
            currentRegion.remove()
            currentRegion = region
            updateAssignedRegion(currentRegion); 
        }
        region.color = 'rgba(116, 255, 88, 0.21)'

    });

    wavesurfer.on('region-updated', region => {
        if (currentRegion) {
            // SAMPLER.setRegion()
        }
    });
      

    wavesurfer.on('region-update-end', (region) => {
        currentRegion = region;
        updateAssignedRegion(currentRegion);
        const currentPad = SAMPLER.currentPad
        currentPad.trigger.buffer_sample = trimAudioBuffer( currentPad.trigger.buffer_full, region.start, region.end )
        SAMPLER.setRegion()
    });


    wavesurfer.container.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
    });
  
    // wavesurfer.on('region-created', region => {
    //     if (currentRegion) {
    //         currentRegion.remove();
    //     }
    //     currentRegion = region;
    //     updateAssignedRegion(region);
    //     console.log('created', region.start, region.end)
    // });
  
    // wavesurfer.on('region-updated', region => {
    //     if (currentRegion) {
    //         currentRegion.remove();
    //     }
    //     currentRegion = region;
    //     updateAssignedRegion(region);
    //     console.log('Updated', region.start, region.end)

    // });
  });

  
  
