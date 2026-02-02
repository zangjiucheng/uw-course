import re


class Course():
    def __init__(self, outDir):
        self.fileOut = open(outDir, "a")
        # self.colorMes = bcolors()

    def SearchCourse(self, CollectionData, courseIndex, color="#878787", classNum=None):
        self.courseSelect = CollectionData.find({"ClassIndex": courseIndex})
        self.color = color

        for course in self.courseSelect:
            if classNum != None:
                if course['_id'] != classNum:
                    continue
            self.time = course['time']
            self.classNum = course['_id']
            self.courseIndex = course['ClassIndex']
            self.courseTitle = course['classTitle']
            self.courseSeat = course['availableSeat']
            if re.search(r"\d:\d*", self.time):
                self.startTime = self.time[0:5]
                self.endTime = self.time[6:11]
                StartTimeFlag = False
                EndTimeFlag = False
                if (int(self.endTime[0:2]) < int(self.startTime[0:2])):
                    EndTimeFlag = True
                if (int(self.startTime[0:2]) < 8):
                    StartTimeFlag = True
                    EndTimeFlag = True
                if StartTimeFlag:
                    self.startTime = str(int(self.startTime[0:2]) + 12) + self.startTime[2:5]
                if EndTimeFlag:
                    self.endTime = str(int(self.endTime[0:2]) + 12) + self.endTime[2:5]
                self.weekDay = "H" if self.time[11:15] == "Th" else self.time[11:15]
                self.writeSchedule()
            else:
                print("Z_Z For course %s in class %s, Time Data Error Z_Z" % (self.courseIndex, self.classNum))

    def writeSchedule(self):
        self.fileOut.write(
            "- name: %s\n" % (str(self.classNum) + " " + self.courseIndex + " " + self.courseTitle + "  Available Seat " + str(self.courseSeat)))
        self.fileOut.write("  days: %s\n" % self.weekDay)
        self.fileOut.write("  time: %s - %s\n" % (self.startTime, self.endTime))
        self.fileOut.write("  color: \"%s\"\n" % self.color)
        self.fileOut.write("\n\n")
