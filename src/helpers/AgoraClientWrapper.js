import AgoraRTC from "agora-rtc-sdk";
import EventEmitter from "events";

export default class RTCClient {
	constructor(
		cameraVideoProfile = "480p_4",
		screenVideoProfile = "480p_2",
		cameraConfig = { mode: "rtc", codec: "h264" },
		screenShareConfig = { mode: "rtc", codec: "vp8" }
	) {
		// Options for joining a channel
		this.option = {
			appId: "",
			channel: "",
			uid: "",
			token: ""
		};
		this.videoStreamConfig = {
			audio: true,
			video: true,
			screen: false
		};
		this.screenShareStreamConfig = {
			audio: true,
			video: true,
			screen: false
		};
		this.client = null;
		this.localStream = {
			camera: {
				id: "",
				stream: {}
			},
			screen: {
				id: "",
				stream: {}
			}
		};
		this._eventBus = new EventEmitter();
		this.cameraVideoProfile = cameraVideoProfile;
		this.screenVideoProfile = screenVideoProfile;
		this.cameraConfig = cameraConfig;
		this.screenShareConfig = screenShareConfig;
	}

	// cameraVideoProfile = '480_4'; // 640 × 480 @ 30fps  & 750kbs
	// screenVideoProfile = '480_2'; // 640 × 480 @ 30fps

	//init client and Join a channel
	joinChannel(option) {
		return new Promise((resolve, reject) => {
			this.client = AgoraRTC.createClient(this.cameraConfig);
			this.client.init(
				option.appid,
				() => {
					console.log("init success");
					this.clientListener();
					this.client.join(
						option.token ? option.token : null,
						option.channel,
						null,
						uid => {
							console.log("join channel: " + this.option.channel + " success, uid: ", uid);
							this.option = {
								appid: option.appid,
								token: option.token,
								channel: option.channel,
								uid: uid
							};
							resolve();
						},
						err => {
							console.error("client join failed", err);
						}
					);
				},
				err => {
					reject(err);
					console.error(err);
				}
			);
			console.log("[agora-vue] appId", option.appid);
		});
	}

	publishStream() {
		return new Promise((resolve, reject) => {
			// Create a local stream
			var localStream = AgoraRTC.createStream({ streamID: this.option.uid, ...this.videoStreamConfig });
			localStream.setVideoProfile(this.cameraVideoProfile);
			// Initialize the local stream
			localStream.init(
				() => {
					console.log("init local stream success");
					resolve(localStream);
					this.localStream.camera.stream = localStream;
					this.localStream.camera.id = localStream.getId();
					// Publish the local stream
					this.client.publish(localStream, err => {
						console.log("publish failed");
						console.error(err);
					});
				},
				err => {
					reject(err);
					console.error("init local stream failed ", err);
				}
			);
		});
	}

	clientListener() {
		const client = this.client;

		client.on("stream-added", evt => {
			// The stream is added to the channel but not locally subscribed
			this._eventBus.emit("stream-added", evt);
		});
		client.on("stream-subscribed", evt => {
			this._eventBus.emit("stream-subscribed", evt);
		});
		client.on("stream-removed", evt => {
			this._eventBus.emit("stream-removed", evt);
		});
		client.on("peer-online", evt => {
			this._eventBus.emit("peer-online", evt);
		});
		client.on("peer-leave", evt => {
			this._eventBus.emit("peer-leave", evt);
		});
	}

	on(eventName, callback) {
		this._eventBus.on(eventName, callback);
	}

	leaveChannel() {
		return new Promise((resolve, reject) => {
			// Leave the channel
			this.client.unpublish(this.localStream.camera.stream, err => {
				console.log(err);
			});
			this.client.leave(
				() => {
					// Stop playing the local stream
					if (this.localStream.camera.stream.isPlaying()) {
						this.localStream.camera.stream.stop();
					}
					// Close the local stream
					this.localStream.camera.stream.close();
					this.client = null;
					resolve();
					console.log("client leaves channel success");
				},
				err => {
					reject(err);
					console.log("channel leave failed");
					console.error(err);
				}
			);
		});
	}

	testDevices() {
		return new Promise(res => {
			AgoraRTC.getDevices(function(devices) {
				var audioDevices = devices.filter(function(device) {
					return device.kind === "audioinput";
				});
				var videoDevices = devices.filter(function(device) {
					return device.kind === "videoinput";
				});

				res({
					audioDevices,
					videoDevices
				});
			});

			// var uid = Math.floor(Math.random() * 10000);
			// var selectedMicrophoneId = ...;
			// var selectedCameraId = ...;
			// var stream = AgoraRTC.createStream({
			// 	streamID: uid,
			// 	// Set audio to true if testing microphone
			// 	audio: true,
			// 	microphoneId: selectedMicrophoneId,
			// 	// Set video to true if testing camera
			// 	video: true,
			// 	cameraId: selectedCameraId,
			// 	screen: false
			// });

			// Initialize the stream
			// stream.init(function() {
			// 	stream.play("mic-test");
			// 	// Print the audio level every 1000 ms
			// 	setInterval(function() {
			// 		console.log(`Local Stream Audio Level ${stream.getAudioLevel()}`);
			// 	}, 1000);
			// });
		});
	}

	testSystemRequirements() {
		return AgoraRTC.checkSystemRequirements();
	}
}
