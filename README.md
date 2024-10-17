# Character Viewer

A Unicode character viewer to help you find the character you need and easily copy it to the clipboard.

## Usage

Once the application is running, you can toggle the visibility of the Character Viewer by pressing **Ctrl + Alt + E**. Quit the application by pressing **Ctrl + Q** when the application window is focused.

Character Viewer is designed for quick, search-based access to Unicode characters. It does not display an exhaustive list of all characters, nor does it support browsing by category.

You can navigate through the character grid using the mouse or the arrow keys. To copy the selected character to the clipboard, simply click on it or press **Enter**.

## Why?

Windows’ charmap.exe and Emoji panel leave much to be desired. I was a longtime fan of WinCompose, but it’s no longer maintained, and Windows Security now flags it as malicious. While it's a false positive, its keypress interception understandably triggers security heuristics.

## Why Electron?

I know, I’m not a fan of Electron either. However, I don’t have enough time to invest in a side project like this, and Electron allows for rapid development. I’d love to see this ported to a native app one day, but that’s a project for someone else. If you do it, please let me know!
