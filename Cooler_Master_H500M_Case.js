export function Name() { return "Cooler Master H500M"; }
export function VendorId() { return 0x2516;}
export function Documentation(){ return "troubleshooting/coolermaster"; }
export function ProductId() { return 0x1001;}
export function Publisher() { return "SkyWreak"; }
export function Size() { return [1, 1]; }
export function DefaultPosition(){return [1, 1];}
export function DefaultScale(){return 1.0;}
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
motherboardPass:readonly
*/
export function ControllableParameters(){
	return [
		{"property":"shutdownColor", "group":"lighting", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"LightingMode", "group":"lighting", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "group":"lighting", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"#009bde"},
		{"property":"motherboardPass", "group":"", "label":"Enable MotherBoard Passthrough", "type":"boolean", "default":"false"},
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
	setmotherboardPass(motherboardPass);
}

export function Render() {

	if(!motherboardPass){
		for(let channel = 0; channel < 4; channel++) {
			SendChannel(channel);
			device.pause(1);
		}
	}
}

export function Shutdown(SystemSuspending) {

	if(!motherboardPass){
		if(SystemSuspending){
			for(let channel = 0; channel < 4; channel++) {
				SendChannel(channel, "#000000");
				device.pause(1);
			}
		}else{
			for(let channel = 0; channel < 4; channel++) {
				SendChannel(channel, shutdownColor);
				device.pause(1);
			}
		}
	}
}

export function onmotherboardPassChanged() {
	setmotherboardPass(motherboardPass);
}

function setmotherboardPass(motherboardPass) {

	if(motherboardPass) {
		device.write([0x00, 0x80, 0x17, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		device.write([0x00, 0x80, 0x01, 0x02], 65);
		
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

export function Validate(endpoint) {
	return endpoint.interface === 0;
}

export function ImageUrl(){
	return "https://ik.imagekit.io/u1nxnwr8gc/mch500m_g4-zoom.png?updatedAt=1714920672045";
};
