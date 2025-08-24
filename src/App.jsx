import { useState } from "react";

import "./App.css";
import Demo from "./Components/Demo";
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Demo />
    </>
  );
}

export default App;
