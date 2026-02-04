from os import makedirs
from os.path import join


class Setting:
    def __init__(self):
        self.dataName = "./uw-course-files"
        self.configFileName = "schedule.out"
        makedirs(self.dataName, exist_ok=True)
        self.outDir = join(self.dataName, self.configFileName)
