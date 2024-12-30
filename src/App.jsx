import { useEffect, useRef, useState,  } from 'react'
import './App.css'

function App() {
  const url = "http://localhost:3000/todo";
  const [isLoading, data] = useFetch(url);
  const [todo, setTodo] = useState([]);
  const [time, setTime] = useState(0);
  const [isTimer, setIsTimer] = useState(false);
  const [currentTodo, setCurrentTodo] = useState(null);

  useEffect(() => {
    setTime(0);
  }, [isTimer]);

  useEffect(() => {
    if (data) setTodo(data);
  }, [isLoading]);

  useEffect(() => {
    if(currentTodo){
      fetch(`http://localhost:3000/todo/${currentTodo}`, {
          method: "PATCH",
          body: JSON.stringify({time: todo.find((el) => el.id === currentTodo).time + 1,
        }),
      }).then(res => res.json())
        .then(res => setTodo(prev => prev.map(el =>el.id === currentTodo)));
    }
  }, [time]);

  return (
    <>
      <h1>TODO LIST</h1>
      <Clock />
      <Advice />
      <button onClick={() => setIsTimer((prev) => !prev)}>{isTimer ? "change to StopWatch" : "change to Timer"}</button>
      { isTimer ? (<Timer time={time} setTime={setTime} /> ): (<StopWatch time={time} setTime={setTime} />)}
      <TodoInput setTodo={setTodo}/>
      <TodoList todo={todo} setTodo={setTodo} currentTodo={currentTodo} setCurrentTodo={setCurrentTodo} />
    </>
  )
}

const TodoInput = ({ setTodo }) => {
  const inputRef = useRef(null);

  const addTodo = () => {
    const newTodo = {
      id: Number(new Date()), 
      content: inputRef.current.value,
      time: 0,
    };
    fetch("http://localhost:3000/todo", {
      method: "POST",
      body: JSON.stringify(newTodo),
    })
      .then((res) => res.json())
      .then((res) => setTodo(prev => [...prev, res]));
    inputRef.current.value = ''; // 입력 필드 초기화
  }

  return (
    <>
      <input ref={inputRef}/>
      <button onClick={addTodo}>Add</button>
    </>
  )
}

const TodoList = ({todo, setTodo, setCurrentTodo}) => {
  return (
    <>
      <ul>
        {todo.map((el) => (
          <Todo key={el.id} todo={el} setTodo={setTodo} setCurrentTodo={setCurrentTodo}/>
        ))}
      </ul>
    </>
  )
} 

const Todo = ({todo, setTodo, currentTodo, setCurrentTodo}) => {
  return (
    <>
      <li className={currentTodo === todo.id ? "current" : ""}>
        <div>
          {todo.content}
          <br />
          {formatTime(todo.time)}
        </div>
        <div>
        <button onClick={() => setCurrentTodo(todo.id)}>Timer Start</button>
        </div>
        <div>
          <button onClick={() => {
            fetch(`http://localhost:3000/todo/${todo.id}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json", // 헤더 추가
              },
            }).then((res) => {
              if(res.ok) {
                setTodo((prev) => prev.filter((el) => el.id !== todo.id));
              }
            });
          }}>Del</button>
          </div>
      </li>
    </>
  )
}

// custom hook
const useFetch = (url) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
    .then((res) => res.json())
    .then((res) => {
      setData(res);
      setIsLoading(false);
    })
    .catch((err) => {
      console.log(err);
      setIsLoading(false);
    });
}, [url]);


  return [isLoading, data, error];
}

const Advice = () => {
  const [isLoading, data] = useFetch("https://korean-advice-open-api.vercel.app/api/advice");

  return(
    <>
      {!isLoading && (
        <>
          <div className='advice'>{data.message}</div>
          <div className='advice'>-{data.author}-</div>
        </>
      )}
    </>
  )
}

const Clock = () => {
  const [time, setTime] = useState(new Date());

  // 처음 렌더링 될때만 적용 -> 인터벌을 끄지 않아도 됨
  useEffect(() => {
    setInterval(() => {
      setTime(new Date())
    }, 1000)
  }, [])

  return (
    <div className='clock'>
        {time.toLocaleTimeString()}
    </div>
  )
}

const formatTime = (seconds) => {
  const timeString = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return timeString;
}

const StopWatch = ({time, setTime}) => {
  const [isOn, setIsOn] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOn == true) {
    const timeId = setInterval(() => {
      setTime((prev) => prev +1);
    }, 1000);
    timerRef.current = timeId;
    } else {
      clearInterval(timerRef.current);
    }
  }, [isOn]);
  
  return (
    <>
    <div>
        {formatTime(time)}
        <button onClick={() => setIsOn(prev => !prev)}>{isOn ? "Off" : "On"}</button>
        <button onClick={() => {
          setTime(0)
          setIsOn(false)
        }}>Reset</button>
      </div>
    </>
  )
}

const Timer = ({time, setTime}) => {
  const [startTime, setStartTime] = useState(0);
  const [isOn, setIsOn] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if(isOn && time > 0){
    const timerId = setInterval(() => {
      setTime(prev => prev - 1)
    }, 1000)
    timerRef.current = timerId;
    } else if(!isOn || time == 0){
      clearInterval(timerRef.current)
    }
    return() => clearInterval(timerRef.current);
  }, [isOn, time])

  return(
    <>
      <div>{time ? formatTime(time) : formatTime(startTime)}
        <button onClick={() => {setIsOn(true); setStartTime(0); setTime(time ? time : startTime)}}>Start</button>
        <button onClick={() => setIsOn(false)}>Stop</button>
        <button onClick={() => {setTime(0); setIsOn(false)}}>Reset</button>
      </div>
      <input type="range" min='0' max='3600' step='30' value={startTime} onChange={(event) => setStartTime(event.target.value)}/>  
    </>
  )
}

export default App
