; POS Monitor - Inno Setup Script
; Creates a Windows Installer (.exe)

#define MyAppName "POS Monitor"
#define MyAppVersion "1.0"
#define MyAppPublisher "Your Company"
#define MyAppURL "https://siamtechie.github.io/POS-Monitor/"
#define MyAppExeName "POS-Monitor.exe"

[Setup]
; Basic Information
AppId={{POS-Monitor-12345678}}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\POS-Monitor
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=installer-output
OutputBaseFilename=POS-Monitor-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

; UI Settings
SetupIconFile=
UninstallDisplayIcon={app}\{#MyAppExeName}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "autostart"; Description: "Start automatically when Windows starts"; GroupDescription: "Auto-start:"; Flags: checkedonce

[Files]
Source: "dist\POS-Monitor.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "config-template.txt"; DestDir: "{app}"; Flags: ignoreversion

[Code]
var
  BranchNamePage: TInputQueryWizardPage;
  BranchName: String;

procedure InitializeWizard;
begin
  { Create custom page for branch name }
  BranchNamePage := CreateInputQueryPage(wpSelectTasks,
    'Branch Information', 'Enter your branch name',
    'Please enter the name of your branch. This will be used to identify this location in the monitoring dashboard.');
  
  BranchNamePage.Add('Branch Name:', False);
  BranchNamePage.Values[0] := 'สาขาทดสอบ';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  
  if CurPageID = BranchNamePage.ID then
  begin
    BranchName := BranchNamePage.Values[0];
    
    if BranchName = '' then
    begin
      MsgBox('Please enter a branch name.', mbError, MB_OK);
      Result := False;
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigFile: String;
  ConfigContent: TArrayOfString;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    { Create config.txt with branch name }
    ConfigFile := ExpandConstant('{app}\config.txt');
    SetArrayLength(ConfigContent, 2);
    ConfigContent[0] := 'BRANCH_NAME=' + BranchName;
    ConfigContent[1] := 'FIREBASE_URL=https://pos-monitor-7bcaf-default-rtdb.asia-southeast1.firebasedatabase.app';
    SaveStringsToFile(ConfigFile, ConfigContent, False);
    
    { Create auto-start task if selected }
    if IsTaskSelected('autostart') then
    begin
      Exec('schtasks', '/create /tn "POS Monitor" /tr "' + ExpandConstant('{app}\{#MyAppExeName}') + '" /sc onstart /ru SYSTEM /rl HIGHEST /f', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    end;
  end;
end;

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "taskkill"; Parameters: "/F /IM {#MyAppExeName}"; Flags: runhidden
Filename: "schtasks"; Parameters: "/delete /tn ""POS Monitor"" /f"; Flags: runhidden

[UninstallDelete]
Type: files; Name: "{app}\config.txt"
Type: files; Name: "{app}\monitor_cache.json"
