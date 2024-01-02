import { SECTION_LIST } from "../constant.js";

const validateClassName = (className) => {
  if (!className) {
    return "Class name is required";
  }
};

const validateSection = (section) => {
  if (!section) {
    return "Section is required";
  }

  if (!SECTION_LIST.includes(section)) {
    return `Section must be one of ${SECTION_LIST}`;
  }
};

export { validateClassName, validateSection };
