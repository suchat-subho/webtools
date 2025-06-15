const courses = [
    { name: "AOS 401/403", teacher: "Dr. Subhrendu" },
];

const courseList = document.getElementById("courses");

courses.forEach(course => {
    const li = document.createElement("li");
    li.classList.add("course");
    li.textContent = `${course.name} - ${course.teacher}`;
    courseList.appendChild(li);
});
