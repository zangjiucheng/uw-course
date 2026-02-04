from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi

class connectDB:
    def __init__(self, mongo_host):
        self.mongo_host = mongo_host
        # self.mongo_port = mongo_port
        self.client = MongoClient(self.mongo_host, server_api=ServerApi('1'),tlsCAFile=certifi.where())
        self.mongo_db = None
        self.mongo_collection = None

    def connectDataBase(self, mongo_db):
        self.mongo_db = self.client[mongo_db]

    def selectCollection(self, collection_name):
        self.mongo_collection = self.mongo_db[collection_name]

    def listCollections(self):
        if self.mongo_db is None:
            return []
        return self.mongo_db.list_collection_names()

    def closeDB(self):
        self.client.close()
