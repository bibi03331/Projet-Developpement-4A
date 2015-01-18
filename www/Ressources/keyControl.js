$(function () {

    wIsDown = false,
    aIsDown = false,
    sIsDown = false,
    dIsDown = false;

  $(document).keydown(function(e){
    switch(e.which){
      case 38:
        if(wIsDown) return;
        wIsDown = true;
	socket.emit('motors', 80, 80);
        $('.up').addClass('active');
        break;
      case 37:
        if(aIsDown) return;
        aIsDown = true;
	socket.emit('motors', -80, 80);
        $('.left').addClass('active');
        break;
      case 40:
        if(sIsDown) return;
        sIsDown = true;
	socket.emit('motors', -80, -80);
        $('.down').addClass('active');
        break;
      case 39:
        if(dIsDown) return;
        dIsDown = true;
	socket.emit('motors', 80, -80);
        $('.right').addClass('active');
        break;
    }
  });

  $(document).keyup(function(e){
    switch(e.which){
      case 38:
        if(!wIsDown) return;
        wIsDown = false;
	socket.emit('motors', 0, 0);
        $('.up').removeClass('active');
        break;
      case 37:
        if(!aIsDown) return;
        aIsDown = false;
	socket.emit('motors', 0, 0);
        $('.left').removeClass('active');
        break;
      case 40:
        if(!sIsDown) return;
        sIsDown = false;
	socket.emit('motors', 0, 0);
        $('.down').removeClass('active');
        break;
      case 39:
        if(!dIsDown) return;
        dIsDown = false;
	socket.emit('motors', 0, 0);
        $('.right').removeClass('active');
        break;
    }
  });


});
