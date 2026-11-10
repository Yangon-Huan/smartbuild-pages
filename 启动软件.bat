@echo off
cd /d "%~dp0"
start "Smart Construction Local Server" /min python server.py
ping 127.0.0.1 -n 2 > nul
start "" "http://127.0.0.1:8876/?launch=%RANDOM%%RANDOM%"
