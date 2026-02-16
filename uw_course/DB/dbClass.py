import os

from ..Utils.manageDBClass import connectDB


class dbClass:
    def __init__(self):
        self.ClassCollectionName = "Class2024Winter"

        self.url = os.environ.get("MONGODB_URI")
        if not self.url:
            raise ValueError(
                "MONGODB_URI environment variable is not set. "
                "Please set it to your MongoDB connection string (e.g. mongodb+srv://user:pass@host/)."
            )

        self.ClassDATABASE = connectDB(mongo_host=self.url)
        self.ClassDATABASE.connectDataBase('UWRegistrationDB')
        self.ClassDATABASE.selectCollection(self.ClassCollectionName)
        self.ClassSchedule = self.ClassDATABASE.mongo_collection

        self.CourseDetailDB = connectDB(mongo_host=self.url)
        self.CourseDetailDB.connectDataBase("UWRegistrationDB")
        self.CourseDetailDB.selectCollection("CourseDetail")
        self.CourseDescribe = self.CourseDetailDB.mongo_collection

    def switchCollection(self, collectionName):
        self.ClassCollectionName = collectionName
        self.ClassDATABASE.selectCollection(self.ClassCollectionName)
        self.ClassSchedule = self.ClassDATABASE.mongo_collection

    def listClassCollections(self):
        collections = self.ClassDATABASE.listCollections()
        term_order = {"Winter": 0, "Spring": 1, "Fall": 2}

        def sort_key(name):
            if not name.startswith("Class"):
                return (9999, 99, name)
            tail = name[len("Class") :]
            year = tail[:4]
            term = tail[4:]
            try:
                year_value = int(year)
            except ValueError:
                year_value = 9999
            term_value = term_order.get(term, 99)
            return (year_value, term_value, name)

        class_names = [name for name in collections if name.startswith("Class")]
        return sorted(class_names, key=sort_key, reverse=True)
