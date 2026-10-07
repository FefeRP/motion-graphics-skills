import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Sin GPU (servidores, CI): ANGLE sobre SwiftShader. En un equipo con GPU puedes quitarlo.
Config.setChromiumOpenGlRenderer("swangle");
