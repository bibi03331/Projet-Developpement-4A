# start node server
sudo node app.js &

# start streaming server
mjpg_streamer -i "/usr/lib/input_uvc.so -d /dev/video0  -r 640x480 -f 25" -o "/usr/lib/output_http.so -p 8090 -w /home/pi/code/mjpg-streamer/www"
