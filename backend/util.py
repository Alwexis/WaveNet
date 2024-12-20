from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7
from models import User, Wavebond
from db import db
import os
from auth import get_user_by_email
import requests
from env_handler import env

SECRET_KEY = env.CYPH_SECRET_KEY
IMGDB_KEY = env.IMGDB_KEY
IMGDB_URL = env.IMGDB_URL

def upload_image(image: bytes):
    #* Creamos el body de la petición con los Bytes de la Imagen
    files = { 'image': image }
    data = { 'key': IMGDB_KEY }
    #* Subimos la imagen a ImgBB
    response = requests.post(IMGDB_URL, data=data, files=files)
    #* Rescatamos la URL de la respuesta.
    json_data = response.json()
    return json_data["data"]["url"]

def update_posts_author(user: User):
    #* Actualizamos los posts del usuario
    result = db.posts.update_many({ "user.uid": user.uid }, { "$set": { "user": user.model_dump() } })

def get_user_post_likes(user: User):
    #* Iteramos los posts del usuario y sumamos los likes
    posts = db.posts.find({ "user.uid": user.uid }, { "likes": 1, "_id": 0 })
    likes = 0
    for post in posts:
        likes += len(post["likes"])
    return likes

def encrypt_aes(content: str) -> bytes:
    #* Creamos la clave AES a partir de la SECRET_KEY
    aes_key = SECRET_KEY.encode('utf-8').ljust(16)[:16]
    
    #* creamos un vector de inivialización (iv) aleatorio
    iv = os.urandom(16)
    
    #* Creamos el cibrado AES con CBC
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    
    #* Agregamos Padding al contenido
    padder = PKCS7(algorithms.AES.block_size).padder()
    padded_content = padder.update(content.encode('utf-8')) + padder.finalize()
    
    #* Ciframos el contenido
    ciphertext = encryptor.update(padded_content) + encryptor.finalize()
    
    #* Deolvemos el IV + ciphertext
    return iv + ciphertext

def decrypt_aes(encrypted_content: bytes) -> str:
    #* Creamos la clave AES a partir de la SECRET_KEY
    aes_key = SECRET_KEY.encode('utf-8').ljust(16)[:16]
    
    #* Separamos el IV del Texto Cifrado
    iv = encrypted_content[:16]
    ciphertext = encrypted_content[16:]
    
    #* Creamos el descifrador AES con CBC
    cipher = Cipher(algorithms.AES(aes_key), modes.CBC(iv))
    decryptor = cipher.decryptor()
    
    #* Desciframos el contenido
    padded_content = decryptor.update(ciphertext) + decryptor.finalize()
    
    #* Eliminamos el padding
    unpadder = PKCS7(algorithms.AES.block_size).unpadder()
    content = unpadder.update(padded_content) + unpadder.finalize()
    
    #* Devolvemos el contenido descifrado
    return content.decode('utf-8')

def generate_wavebond(user: User, wavebond: Wavebond, generateFromZero: bool = False):
    #* En caso de que sea de cero, la versión será 0.1 en caso contrario, se sumará 0.1 a la versión actual
    #* Esto es para una función futura en la cual se vuelvan obsoletos los wavebonds antiguos
    if generateFromZero:
        version = 0.1
    else:
        version = wavebond.version + 0.1
    #* Creamos el contenido del wavebond y lo ciframos.
    content = f"username={user.username};email={user.email};version={version}"
    cifrado = encrypt_aes(content)

    #* Lo almacenamos en un archivo con el nombre del usuario y lo guardamos en la base de datos
    file_path = f"./wavebonds/{user.username}.wavebond"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)  # Asegurar que la carpeta existe
    
    with open(file_path, "wb") as f:
        f.write(cifrado)

    db.wavebonds.update_one({ "user": user.uid }, { "$set": { "wave": cifrado, "version": version } }, upsert=True)

    return file_path

def get_wavebond(user: User):
    #* Obtenemos el wavebond del usuario
    wavebond = db.wavebonds.find_one({ "user": user.uid })
    if wavebond:
        return Wavebond(**wavebond)
    return None

def get_user_from_wavebond(wavebond: bytes):
    #* Desciframos el wavebond y obtenemos el usuario
    content = decrypt_aes(wavebond)
    #* La función lambda separa el contenido en un diccionario de clave=valor
    data = dict(map(lambda x: x.split("="), content.split(";")))
    user = get_user_by_email(data["email"])
    return user