import eel
import sys
import os

from src_python import api 

def start_app():
    eel.init('src_ui/dist') 
    print("Iniciando DataFlow Builder...")
    eel.start('index.html', host='localhost', port=8080,  size=(1280, 720))

if __name__ == '__main__':
    start_app()