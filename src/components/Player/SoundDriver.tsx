import Drawer from "./Drawer";

class SoundDriver {
  private readonly audiFile; // audio file

  private drawer?: Drawer; // instance of Drawer

  private context: AudioContext; // for working with audio

  private gainNode?: GainNode = undefined; // sound volume controller

  private audioBuffer?: AudioBuffer = undefined; // storing the decoded audio

  private bufferSource?: AudioBufferSourceNode = undefined; // audio buffer source, to play the sound

  private startedAt = 0;

  private pausedAt = 0;

  private isRunning = false; // for "play" not to work if the song is playing already + for "pause" to pause, obviously

  private volume = 1; // to fix the "change volume" bug

  constructor(audioFile: Blob) {
    this.audiFile = audioFile; // our song
    this.context = new AudioContext(); // audio context to work with audio
  }

  static showError(error: string) {
    return error;
    alert(
      "SoundParser constructor error. Can not read audio file as ArrayBuffer" // !!! Why do we need this code? !!!
    );
  }

  public init(parent: HTMLElement | null) {
    // getting the future wave container here
    return new Promise((resolve, reject) => {
      if (!parent) {
        // we must pass the future wave container
        reject(new Error("Parent element not found"));
        return;
      }

      const reader = new FileReader();
      reader.readAsArrayBuffer(this.audiFile); // program won't work without reading the file
      reader.onload = (event: ProgressEvent<FileReader>) =>
        this.loadSound(event) // decode the sound
          .then((buffer) => {
            this.audioBuffer = buffer; // saving decoded sound
            this.drawer = new Drawer(buffer, parent); // create instance of Drawer with "decoded sound" and "wave container"
            resolve(undefined);
          });
      reader.onerror = reject; // if error while reading file => reject
    });
  }

  private loadSound(readerEvent: ProgressEvent<FileReader>) {
    if (!readerEvent?.target?.result) {
      throw new Error("Can not read file");
    }

    return this.context.decodeAudioData(
      // decode the sound
      readerEvent.target.result as ArrayBuffer
    );
  }

  public async play() {
    if (!this.audioBuffer) {
      throw new Error(
        "Play error. Audio buffer does not exist. Try to call loadSound before Play."
      );
    }

    if (this.isRunning) {
      // if already playing => break
      return;
    }

    this.gainNode = this.context.createGain(); // creating volume controller
    this.gainNode.gain.value = this.volume; // to fix the "change volume" bug

    this.bufferSource = this.context.createBufferSource();
    this.bufferSource.buffer = this.audioBuffer; // assign the loaded buffer to the buffer source

    this.bufferSource.connect(this.gainNode); // connecting buffer source to the volume controller
    this.bufferSource.connect(this.context.destination); // !!! Why do we need this code? !!!

    this.gainNode.connect(this.context.destination); // connecting volume controller to the output

    await this.context.resume(); // resume the context if it was suspended
    this.bufferSource.start(0, this.pausedAt); // start playing the song taking the paused time into account

    this.startedAt = this.context.currentTime - this.pausedAt; // !!! why not 0? !!! set the start time
    this.pausedAt = 0; // reset the pause time !!! why do we need it? !!!

    this.isRunning = true;
  }

  public async pause(reset?: boolean) {
    if (!this.bufferSource || !this.gainNode) {
      throw new Error(
        "Pause - bufferSource is not exists. Maybe you forgot to call Play before?"
      );
    }

    await this.context.suspend(); // pause the song

    this.pausedAt = reset ? 0 : this.context.currentTime - this.startedAt; // reset pause time or real pause time
    this.bufferSource.stop(this.pausedAt); // stop buffer source
    this.bufferSource.disconnect(); // delete all bufferSource's connections
    this.gainNode.disconnect(); // delete all gainNode's connections

    this.isRunning = false;
  }

  public changeVolume(volume: number) {
    if (!this.gainNode) {
      return;
    }
    this.volume = volume; // to fix the "change volume" bug
    this.gainNode.gain.value = volume; // changing volume
  }

  public drawChart() {
    this.drawer?.init(); // using drawer for rendering
  }
}

export default SoundDriver;
