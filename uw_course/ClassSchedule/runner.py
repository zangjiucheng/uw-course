from uw_course.ClassSchedule.SearchInfo import Course
from uw_course.Utiles.randomColor import randomColor, randomGray
from uw_course.setting import Setting

from os import remove

setting = Setting()


def get_course_detail(dbClassUW, courseIndex):
    if not courseIndex or not str(courseIndex).strip() or " " not in str(courseIndex).strip():
        return None
    CourseDescribe = dbClassUW.CourseDescribe
    faculty = courseIndex.split(" ")[0]
    courseNum = courseIndex.split(" ")[1]
    FacultyList = CourseDescribe.find({"faculty": faculty})
    for course in FacultyList:
        if course.get("courseIndex") == courseNum:
            return course
    return None


def SearchCourse(dbClassUW, courseIndex):
    course = get_course_detail(dbClassUW, courseIndex)
    if not course:
        print("@_@ Course %s Not Found @_@" % (courseIndex))
        return
    print("\n" + "$" * 50 + "\n\n")
    print("Description: ", end="")
    print(course.get("courseDescription"))
    print("\ncourseCredit: ", end="")
    print(course.get("courseCredit"))
    print("\n\n" + "$" * 50)
    print("\n\n")


def SearchAvalibleInTerm(dbClassUW, courseIndex, classNum=None, quiet=False):
    ClassSchedule = dbClassUW.ClassSchedule
    courseSelect = ClassSchedule.find({"ClassIndex": courseIndex})
    if courseSelect == None:
        if not quiet:
            print("@_@ Course %s Not Found in %s @_@" % (courseIndex, dbClassUW.ClassCollectionName))
        return None
    else:
        if not quiet:
            print("!! Found Course %s in %s !!" % (courseIndex, dbClassUW.ClassCollectionName))
        if classNum != None:
            return [courseIndex, classNum]
        return [courseIndex]


def makeSchedule(dbClassUW, courseWishList: list, gray: bool=False):
    classSchedule = dbClassUW.ClassSchedule
    if gray:
        print("!! Make Schedule with Gray Color !!")
    try:
        remove(setting.outDir)
    except:
        pass
    file = open(setting.outDir, 'w+')
    file.close()
    courseInfo = Course(outDir=setting.outDir)

    ### List Course Here
    for course in courseWishList:
        if len(course) == 2:
            classNum = course[1]
            course = course[0]
        else:
            classNum = None
            course = course[0]
        if gray:
            courseInfo.SearchCourse(CollectionData=classSchedule, courseIndex=course, color=randomGray(),
                                    classNum=classNum)
        else:
            courseInfo.SearchCourse(CollectionData=classSchedule, courseIndex=course, color=randomColor(),
                                    classNum=classNum)
    ###
