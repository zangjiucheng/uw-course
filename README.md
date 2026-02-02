# uw-course

[![PyPI version](https://badge.fury.io/py/uw-course.svg)](https://badge.fury.io/py/uw-course)


This is a project for UWaterloo students to help them get course information and generate a schedule for the next term.

MongoDB DashBoard: [LINK](https://charts.mongodb.com/charts-project-0-cbzai/public/dashboards/091bc68f-76df-48c0-aa69-b21af14c0a8a)

### Example Schedule: 

![Image text](demo.png)

---

### Install Steps: 
1. Install Python3 (>= 3.7) [Python Website](https://www.python.org/downloads/)
2. ```bash
   pip install uw-course
   ```

---

### Usage (TUI)

Run the terminal UI:
```bash
uw-course
```

You can:
- Check course details
- Build a schedule from a file
- Export the `.out` schedule to PDF

#### Schedule File Format
1. Create a new file named `schedule.txt` in the folder you want to save the schedule
2. Edit `schedule.txt` with the following format:
```txt
Class{year}{Winter/Summer/Fall}

{Course}{CourseName}, {ClassID}
{Course}{CourseName}, {ClassID}
...
```

Example:
```txt
Class2025Winter

PHYS 234, 7166
CS 431, 8788
PMATH 351, 6382
CO 353, 6157
STAT 231, 6097
AMATH 250, 5967
```
3. Use the TUI to select “Build Schedule” and provide the file path.
4. The program will generate `schedule.out`, and you can export it to PDF from the TUI.

#### Any Idea or Question, welcome send me an email via: j7zang@uwaterloo.ca

---

## License

This project is open-source and can be modified and used for personal or educational purposes. Attribution to the original creator is appreciated. (MIT License)
