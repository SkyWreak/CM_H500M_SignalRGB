export function Name() { return "Cooler Master H500M"; }
export function VendorId() { return   0x2516;}
export function Documentation(){ return "troubleshooting/coolermaster"; }
export function ProductId() { return   0x1001;}
export function Publisher() { return "SkyWreak"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [1, 1];}
export function DefaultScale(){return 1.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
motherboardPass:readonly
RGBHeaderToggle:readonly
RGBconfig:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"motherboardPass", "group":"", "label":"Enable MotherBoard Passthrough", "type":"boolean", "default":"false"},
		{"property":"RGBHeaderToggle", "group":"", "label":"Enable RGBHeader", "type":"boolean", "default":"True"},
		{"property":"RGBconfig", "group":"lighting", "label":"RGB Header Config", "type":"combobox",   "values":["RGB", "RBG", "BGR", "BRG", "GBR", "GRB"], "default":"GRB"},


	];
}

const ParentDeviceName = "Cooler Master H500M";
export function SubdeviceController(){ return true; }
const DeviceMaxLedLimit = 196;
//Channel Name, Led Limit
const ChannelArray =
[
	["Channel 1", 48],
	["Channel 2", 48],
	["Channel 3", 48],
	["Channel 4", 48],
];

function SetupChannels(){
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++) {
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}

export function Initialize() {
	SetupChannels();
	setRGBHeader(RGBHeaderToggle);
	setmotherboardPass(motherboardPass);
}

export function Render() {

	if(!motherboardPass){
		for(let channel = 0; channel < 4; channel++) {
			SendChannel(channel);
			device.pause(1);
		}

		sendRGBHeader(RGBHeaderToggle);
	}
}

export function Shutdown(SystemSuspending) {

	if(!motherboardPass){
		if(SystemSuspending){
			for(let channel = 0; channel < 4; channel++) {
				SendChannel(channel, "#000000");
				device.pause(1);
			}

			sendRGBHeader(RGBHeaderToggle, "#000000");
		}else{
			for(let channel = 0; channel < 4; channel++) {
				SendChannel(channel, shutdownColor);
				device.pause(1);
			}

			sendRGBHeader(RGBHeaderToggle, shutdownColor);
		}
	}
}

export function onmotherboardPassChanged() {
	setmotherboardPass(motherboardPass);
}

export function onRGBHeaderToggleChanged() {
	setRGBHeader(RGBHeaderToggle);
}

const RGBConfigs =
{
	"RGB" : [0, 1, 2],
	"RBG" : [0, 2, 1],
	"BGR" : [2, 1, 0],
	"BRG" : [2, 0, 1],
	"GBR" : [1, 2, 0],
	"GRB" : [1, 0, 2]
};


function setmotherboardPass(motherboardPass) {

	if(motherboardPass) {
		device.write([0x00, 0x80, 0x17, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x04, 0x01], 65); //RGB header

	} else {
		device.write([0x00, 0x080, 0x01, 0x01], 65);
	}
}

function SendChannel(Channel, overrideColor) {

	let ChannelLedCount = device.channel(ChannelArray[Channel][0]).ledCount;
	const componentChannel = device.channel(ChannelArray[Channel][0]);

	let RGBData = [];

	if(LightingMode === "Forced"){
		RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline");

	}else if(componentChannel.shouldPulseColors()){
		ChannelLedCount = 48;

		const pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0]);
		RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline");

	}else if(overrideColor){
		RGBData = device.createColorArray(overrideColor, ChannelLedCount, "Inline");
	}else{
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline");
	}

	device.write([0x00, 0x00, 0x10, 0x02, Channel, 0x30].concat(RGBData.splice(0, 59)), 65);

	device.write([0x00, 0x01].concat(RGBData.splice(0, 63)), 65);

	device.write([0x00, 0x82].concat(RGBData.splice(0, 62)), 65);
}

function sendRGBHeader(RGBHeaderToggle = false, overrideColor){
	device.write([0x00, 0x080, 0x01, 0x03], 65);


	if(RGBHeaderToggle){
		const iPxX = RGB_Header.positioning[0][0];
		const iPxY = RGB_Header.positioning[0][1];
		let Color;

		//find colors
		if(overrideColor){
			Color = hexToRgb(overrideColor);
		}else if (LightingMode === "Forced") {
			Color = hexToRgb(forcedColor);
		}else{
			Color = device.subdeviceColor("RGBHeader", iPxX, iPxY);
		}

		device.write([0x00, 0x80, 0x04, 0x05, 0x10, 0x02, 0xFF, Color[RGBConfigs[RGBconfig][0]], Color[RGBConfigs[RGBconfig][1]], Color[RGBConfigs[RGBconfig][2]]], 65);

	}
}


function setRGBHeader(RGBHeaderToggle = false){

	if(!RGBHeaderToggle){
		device.removeSubdevice("RGBHeader");
	}else{
		//"Ch1 | Port 1"
		device.createSubdevice("RGBHeader");
		// Parent Device + Sub device Name + Ports
		device.setSubdeviceName("RGBHeader", `${ParentDeviceName} - ${RGB_Header.displayName}`);
		device.setSubdeviceImage("RGBHeader", RGB_Header.image);
		device.setSubdeviceSize("RGBHeader", RGB_Header.width, RGB_Header.height);
		device.setSubdeviceLeds("RGBHeader", RGB_Header.LedNames, RGB_Header.positioning);

	}
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

export function Validate(endpoint) {
	return endpoint.interface === 0;
}

export function ImageUrl(){
	return "https://github.com/SkyWreak/CM-H500m-signalrgb-plugin/blob/1c17d32a1b6b1b763eb2d7fbffb1754d9c278c46/mch500m_g4-zoom.png";
}

