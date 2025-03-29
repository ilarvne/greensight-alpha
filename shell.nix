# shell.nix
{ pkgs ? import <nixpkgs> {} }:

let
  # Define the Android SDK components you need
  # android-tools provides adb and fastboot
  # You might need specific build-tools and platforms depending on your project
  androidComposition = pkgs.androidenv.composeAndroidPackages {
     # platform-tools is often implicitly included or use android-tools
     # build-tools version might need adjustment based on project requirements
     buildToolsVersions = [ "34.0.0" ]; # Example version, check project needs
     # platform versions might need adjustment
     platformVersions = [ "34" ];      # Example version, check project needs
     # Add other components if needed: cmdline-tools, emulator, etc.
  };
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20 # Your Node.js
    yarn      # Your package manager

    # Add the composed Android SDK environment
    androidComposition.androidsdk

    # You might also need JDK if not pulled in by androidComposition
    # openjdk17 

    watchman # Optional but recommended for Metro
  ];

  # Set ANDROID_HOME automatically using the path from the Nix package
  # Note: Some tools might prefer ANDROID_SDK_ROOT, but ANDROID_HOME is more common.
  # The exact path might differ slightly based on nixpkgs version, 
  # but androidComposition.androidsdk should expose the root.
  ANDROID_HOME = "${androidComposition.androidsdk}/libexec/android-sdk"; 

  # Optional: Add SDK tools to path explicitly if needed (usually handled by buildInputs)
  # shellHook = ''
  #   export PATH=${androidComposition.androidsdk}/bin:$PATH
  #   export PATH=${androidComposition.androidsdk}/platform-tools:$PATH 
  # '';
}