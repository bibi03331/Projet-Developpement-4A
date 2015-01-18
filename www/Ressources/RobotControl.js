
var ValX, ValY
var ValXSup = 125
var ValXInf = -125
var ValYSup = 125
var ValYInf = -125
var CmdSentGauche = 0, CmdSentDroit = 0, CmdSentMot = 0, CmdSentTour = 0
var Mode = 0

function CalculOrigin (Xt, Xo, Yt, Yo)
{

    ValX = Xt - Xo;
    ValY = Yt - Yo;
    //c.fillText(" x:" + ValX+ " y:" + ValY, 250, 250);
    LimValue();
}

function LimValue ()
{
    if (ValX > ValXSup)
    {
        ValX = ValXSup
    }
    else if (ValX < ValXInf)
    {
        ValX = ValXInf
    }
    if (ValY > ValYSup)
    {
        ValY = ValYSup
    }
    else if (ValY < ValYInf)
    {
        ValY = ValYInf
    }
    //c.fillText(" x:" + ValX+ " y:" + ValY, 250, 260);
    BornesReperes ();
}
function ChangeMode () {
    if (Mode == 0){
        Mode = 1;
    } else {
        Mode = 0;
    }
    //c.fillText(" Mode:" + Mode, 250, 340);
}

function BornesReperes ()
{
    if (ValX > 0) {
        ValX = (ValX*100) / ValXSup;
    }
    else if (ValX < 0) {
        ValX = (ValX*100) / -ValXInf;
    }
    if (ValY > 0) {
        ValY = (ValY*100) / ValYSup;
    }
    else if (ValY < 0) {
        ValY = (ValY*100) / -ValYInf;
    }
    //c.fillText(" x:" + ValX+ " y:" + ValY, 250, 270);
    //c.fillText(" Mode:" + Mode, 200, 340);

    if (Mode == 0) {
        CalculCmdModeRobot ();
    } else {
        CalculCmdModeTourelle ();
    }
}

function CalculCmdModeRobot ()
{
    var MotDroit = 0
    var MotGauche = 0
    var RotMot = 0
    var AngleTour = 0

    if (ValY < 0) { // Avancer
        if (ValX > 0) { // Déplacement à droite
            MotDroit = ValY + ValX;
            MotGauche = ValY;
        }
        else if (ValX < 0) { // Déplacement à gauche
            MotDroit = ValY;
            MotGauche = ValY - ValX;
        }
        else {
        	MotDroit = ValY;
        	MotGauche = ValY;
        }
    }
    else if (ValY > 0) { // Reculer
        if (ValX > 0) { // Déplacement à droite
            MotDroit = ValY - ValX;
            MotGauche = ValY;
        }
        else if (ValX < 0) { // Déplacement à gauche
            MotDroit = ValY;
            MotGauche = ValY + ValX;
        }
        else {
        	MotDroit = ValY;
        	MotGauche = ValY;
        }
    }
    else if (ValY == 0 && ValX != 0) {
    	MotDroit = ValX;
    	MotGauche = ValX;
    }

    // Inversement pour obtenir valeur positive
    MotDroit = -MotDroit;
    MotGauche = -MotGauche;

    CmdMot (MotGauche, MotDroit, RotMot, AngleTour);

    //c.fillText(" MotDroit:" + MotDroit + " MotGauche:" + MotGauche , 250, 290);
    //c.fillText(" MotDroit:" + MotDroit + " MotGauche:" + MotGauche + " AngleTour:" + AngleTour, 250, 300);
}

function CalculCmdModeTourelle () {
    var MotGauche = 0, MotDroit = 0, RotMot = 0, AngleTour = 0

    if (ValY != 0) {
        RotMot = ValX;
    }

    if (ValX != 0) {
        AngleTour = -ValY
    }

    CmdMot (MotGauche, MotDroit, RotMot, AngleTour);
    c.fillText(" x:" + ValX+ " y:" + ValY, 250, 300);
    //c.fillText(" MotDroit:" + MotDroit + " MotGauche:" + MotGauche + " AngleTour:" + AngleTour, 250, 310);
}

function CmdMot (MotGauche, MotDroit, RotMot, AngleTour) {
    var CmdMotGauche = 0, CmdMotDroit = 0, CmdRotMot = 0, CmdAngleTour = 0
    if (Mode == 0){
        CmdMotGauche = GraduationCmdMoteur (MotGauche);
        CmdMotDroit = GraduationCmdMoteur (MotDroit);
    } else {
        CmdRotMot = GraduationCmdMoteur (RotMot);
        CmdAngleTour = GraduationCmdMoteur (AngleTour);
    }
    SendSocket (CmdMotGauche, CmdMotDroit, CmdRotMot, CmdAngleTour);
    
    c.fillText(" CmdMotDroit:" + CmdMotDroit + " CmdMotGauche:" + CmdMotGauche + " CmdRotMot:" + CmdRotMot + " CmdAngleTour:" + CmdAngleTour, 250, 320);
}

function GraduationCmdMoteur (ValueEchelle)
{
    if ((ValueEchelle > 0) && (ValueEchelle != 100)) {
        ValueEchelle = (parseInt((ValueEchelle*0.1)) + 1) * 10;
    } else if ((ValueEchelle < 0) && (ValueEchelle != -100)) {
        ValueEchelle = (parseInt((ValueEchelle*0.1)) - 1) * 10;
    }
    if (ValueEchelle < 20 && ValueEchelle > -20){
        ValueEchelle = 0;
    }
    return ValueEchelle;
}

//Comparaison T-1
// Mémorisation T

function SendSocket (CmdMotGauche, CmdMotDroit, CmdRotMot, CmdAngleTour) {

    var FlagModif = 0;

    if (CmdSentGauche != CmdMotGauche){
        CmdSentGauche = CmdMotGauche;
        FlagModif = 1;
    }
    if (CmdSentDroit != CmdMotDroit){
        CmdSentDroit = CmdMotDroit;
        FlagModif = 1;
    }
    if (CmdSentMot != CmdRotMot){
        CmdSentMot = CmdRotMot;
        FlagModif = 1;
    }
    if (CmdSentTour != CmdAngleTour){
        CmdSentTour = CmdAngleTour;
        FlagModif = 1;
    }

    if ((FlagModif == 1) && (Mode == 0)) {
      motors(CmdSentDroit, CmdSentGauche);
      FlagModif = 0;
    } else if ((FlagModif == 1) && (Mode == 1)){
      camera(CmdSentTour, CmdSentMot);
      FlagModif = 0;
    }
}

function motors(valueMotorsRightSide, valueMotorsLeftSide) {
    socket.emit('motors', valueMotorsLeftSide, valueMotorsRightSide);
}

function camera(valueCamUpDown, valueCamRightLeft) {
    socket.emit('camera', valueCamUpDown, valueCamRightLeft);
}
