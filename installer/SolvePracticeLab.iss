; Per-user installer: the app can replace its executable during a verified update.
#ifndef AppVersion
#define AppVersion "1.4.1"
#endif

[Setup]
AppId={{B3DF70EA-8048-4AB9-946D-2C3643443D26}
AppName=Solve Practice Lab
AppVersion={#AppVersion}
AppPublisher=Solve Practice Lab
DefaultDirName={localappdata}\Programs\Solve Practice Lab
DefaultGroupName=Solve Practice Lab
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename=SolvePracticeLab-Setup-{#AppVersion}
SetupIconFile=..\build\solve-lab.ico
UninstallDisplayIcon={app}\SolvePracticeLab.exe
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
RestartApplications=no
ArchitecturesAllowed=x64compatible

[Files]
Source: "..\dist\SolvePracticeLab.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\Solve Practice Lab"; Filename: "{app}\SolvePracticeLab.exe"
Name: "{autodesktop}\Solve Practice Lab"; Filename: "{app}\SolvePracticeLab.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:"

[Run]
Filename: "{app}\SolvePracticeLab.exe"; Description: "Launch Solve Practice Lab"; Flags: nowait postinstall skipifsilent
