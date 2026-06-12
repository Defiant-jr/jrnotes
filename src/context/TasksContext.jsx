import { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { tasksApi } from '../services/tasksApi.js';

const TasksContext = createContext(null);

const initialState = {
  tasks: [],
  completed: [],
  loading: false,
  error: null,
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
    case 'SET_TASKS': return { ...state, tasks: Array.isArray(action.payload) ? action.payload : [], loading: false };
    case 'SET_COMPLETED': return { ...state, completed: Array.isArray(action.payload) ? action.payload : [], loading: false };
    case 'ADD_TASK': return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'REMOVE_TASK': return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'UPDATE_TASK': return {
      ...state,
      tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      completed: state.completed.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
    };
    case 'MOVE_TO_COMPLETED': {
      const task = state.tasks.find(t => t.id === action.payload);
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
        completed: task ? [{ ...task, status: 'completed' }, ...state.completed] : state.completed,
      };
    }
    case 'MOVE_TO_ACTIVE': {
      const task = state.completed.find(t => t.id === action.payload);
      return {
        ...state,
        completed: state.completed.filter(t => t.id !== action.payload),
        tasks: task ? [{ ...task, status: 'needsAction' }, ...state.tasks] : state.tasks,
      };
    }
    case 'REMOVE_COMPLETED': return { ...state, completed: state.completed.filter(t => t.id !== action.payload) };
    case 'SET_TOAST': return { ...state, toast: action.payload };
    default: return state;
  }
}

export function TasksProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    dispatch({ type: 'SET_TOAST', payload: { message, type } });
    toastTimer.current = setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 3500);
  }, []);

  const loadTasks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await tasksApi.list(false);
      dispatch({ type: 'SET_TASKS', payload: data.items || [] });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      showToast(err.message, 'error');
    }
  }, [showToast]);

  const loadCompleted = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await tasksApi.list(true);
      dispatch({ type: 'SET_COMPLETED', payload: data.items || [] });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
      showToast(err.message, 'error');
    }
  }, [showToast]);

  const addTask = useCallback(async (body) => {
    try {
      const task = await tasksApi.create(body);
      dispatch({ type: 'ADD_TASK', payload: task });
      showToast('Tarefa criada com sucesso!');
      return task;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [showToast]);

  const editTask = useCallback(async (id, body) => {
    try {
      const task = await tasksApi.update(id, body);
      dispatch({ type: 'UPDATE_TASK', payload: task });
      showToast('Tarefa atualizada!');
      return task;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [showToast]);

  const removeTask = useCallback(async (id) => {
    try {
      await tasksApi.remove(id);
      dispatch({ type: 'REMOVE_TASK', payload: id });
      dispatch({ type: 'REMOVE_COMPLETED', payload: id });
      showToast('Tarefa excluída.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [showToast]);

  const completeTask = useCallback(async (id) => {
    try {
      await tasksApi.complete(id);
      dispatch({ type: 'MOVE_TO_COMPLETED', payload: id });
      showToast('Tarefa concluída!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [showToast]);

  const reopenTask = useCallback(async (id) => {
    try {
      await tasksApi.reopen(id);
      dispatch({ type: 'MOVE_TO_ACTIVE', payload: id });
      showToast('Tarefa reaberta!');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [showToast]);

  function getTaskStatus(task) {
    if (task.status === 'completed') return 'completed';
    if (!task.due) return 'pending';
    const dueKey = String(task.due).slice(0, 10);
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    if (dueKey === todayKey) return 'today';
    if (dueKey < todayKey) return 'overdue';
    return 'pending';
  }

  const todayTasks = state.tasks.filter(t => {
    const status = getTaskStatus(t);
    return status === 'today' || status === 'overdue';
  });

  const stats = {
    total: state.tasks.length,
    today: todayTasks.length,
    overdue: state.tasks.filter(t => getTaskStatus(t) === 'overdue').length,
    completed: state.completed.length,
  };

  return (
    <TasksContext.Provider value={{
      ...state,
      todayTasks,
      stats,
      loadTasks,
      loadCompleted,
      addTask,
      editTask,
      removeTask,
      completeTask,
      reopenTask,
      getTaskStatus,
    }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
}
