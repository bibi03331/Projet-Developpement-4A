import smbus
import time
import sys
import os

upDown = int(sys.argv[1]);
rightLeft = int(sys.argv[2]);
verbose = sys.argv[2];

wayLeftSide = -1;
wayRightSide = -1;

if (rightLeft > 0):
	rightSideSpeed = rightLeft * 2.5;
	leftSideSpeed = rightLeft * 2.5;
	wayRightSide = 1;
	wayLeftSide = 0;

elif (rightLeft < 0):
	rightSideSpeed = rightLeft * (-2.5);
	leftSideSpeed = rightLeft * (-2.5);
	wayRightSide = 0;
	wayLeftSide = 1;

else:
	rightSideSpeed = 0;
	leftSideSpeed = 0;
	wayRightSide = 0;
	wayLeftSide = 0;

upDown = upDown + 100;
upDownOrder = upDown * 0.9;

rightSpeedOrder = int(rightSideSpeed);
leftSpeedOrder = int(leftSideSpeed);

if (verbose == 'v'):
	print "Envoi des consignes moteur et camera au micro-controleur :";
	print "   - Cote gauche : ";
	print "     - Vitesse : ", leftSpeedOrder;
	print "     - Sens : ", wayRightSide;
	print "   - Cote droit : ";
	print "   	- Vitesse : ", rightSpeedOrder;
	print "     - Sens : ", wayLeftSide;
	print "   - Tourelle : ", int(upDownOrder);

bus = smbus.SMBus(1);
address_micro = 0x12;

bus.write_byte(address_micro, 255);
bus.write_byte(address_micro, 13);
bus.write_byte(address_micro, leftSpeedOrder);
bus.write_byte(address_micro, wayLeftSide);

bus.write_byte(address_micro, 255);
bus.write_byte(address_micro, 24);
bus.write_byte(address_micro, rightSpeedOrder);
bus.write_byte(address_micro, wayRightSide);

"""
bus.write_byte(address_micro, 254);
bus.write_byte(address_micro, int(upDownOrder));
"""
