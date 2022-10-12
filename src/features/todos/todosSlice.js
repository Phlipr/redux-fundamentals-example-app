import { client } from '../../api/client'
import { createSelector } from 'reselect'
import { StatusFilters } from '../filters/filtersSlice'

const initialState = {
  status: 'idle',
  entities: {},
}

const TodoActionTypes = {
  ADD_TODO: 'todos/todoAdded',
  TOGGLE_TODO: 'todos/todoToggled',
  COLOR_SELECTED: 'todos/colorSelected',
  DELETE_TODO: 'todos/todoDeleted',
  COMPLETE_ALL: 'todos/allCompleted',
  CLEAR_COMPLETED: 'todos/completedCleared',
  TODOS_LOADING: 'todos/todosLoading',
  TODOS_LOADED: 'todos/todosLoaded',
}

export default function todosReducer(state = initialState, action) {
  switch (action.type) {
    case TodoActionTypes.ADD_TODO: {
      const todo = action.payload
      return {
        ...state,
        entities: {
          ...state.entities,
          [todo.id]: todo,
        },
      }
    }
    case TodoActionTypes.TOGGLE_TODO: {
      const todoId = action.payload
      const todo = state.entities[todoId]
      return {
        ...state,
        entities: {
          ...state.entities,
          [todoId]: {
            ...todo,
            completed: !todo.completed,
          },
        },
      }
    }
    case TodoActionTypes.COLOR_SELECTED: {
      const { color, todoId } = action.payload
      const todo = state.entities[todoId]
      return {
        ...state,
        entities: {
          ...state.entities,
          [todoId]: {
            ...todo,
            color,
          },
        },
      }
    }
    case TodoActionTypes.DELETE_TODO: {
      const newEntities = { ...state.entities }
      delete newEntities[action.payload]
      return {
        ...state,
        entities: newEntities,
      }
    }
    case TodoActionTypes.COMPLETE_ALL: {
      const newEntities = { ...state.entities }
      Object.values(newEntities).forEach((todo) => {
        newEntities[todo.id] = {
          ...todo,
          completed: true,
        }
      })
      return {
        ...state,
        entities: newEntities,
      }
    }
    case TodoActionTypes.CLEAR_COMPLETED: {
      const newEntities = { ...state.entities }
      Object.values(newEntities).forEach((todo) => {
        if (todo.completed) {
          delete newEntities[todo.id]
        }
      })
      return {
        ...state,
        entities: newEntities,
      }
    }
    case TodoActionTypes.TODOS_LOADING: {
      return {
        ...state,
        status: 'loading',
      }
    }
    case TodoActionTypes.TODOS_LOADED: {
      const newEntities = {}
      action.payload.forEach((todo) => {
        newEntities[todo.id] = todo
      })
      return {
        ...state,
        status: 'idle',
        entities: newEntities,
      }
    }
    default:
      return state
  }
}

// Action creators

export const todosLoaded = (todos) => ({
  type: TodoActionTypes.TODOS_LOADED,
  payload: todos,
})

export const todoAdded = (todo) => ({
  type: TodoActionTypes.ADD_TODO,
  payload: todo,
})

export const toggleTodo = (todoId) => ({
  type: TodoActionTypes.TOGGLE_TODO,
  payload: todoId,
})

export const selectColor = (color, todoId) => ({
  type: TodoActionTypes.COLOR_SELECTED,
  payload: { color, todoId },
})

export const deleteTodo = (todoId) => ({
  type: TodoActionTypes.DELETE_TODO,
  payload: todoId,
})

export const todosAllCompleted = () => ({
  type: TodoActionTypes.COMPLETE_ALL,
})

export const todosClearCompleted = () => ({
  type: TodoActionTypes.CLEAR_COMPLETED,
})

export const todosLoading = () => ({
  type: TodoActionTypes.TODOS_LOADING,
})

// Selectors

const selectTodoEntities = (state) => state.todos.entities

export const selectTodos = createSelector(selectTodoEntities, (entities) =>
  Object.values(entities)
)

export const selectLoadingState = (state) => state.status

export const selectTodoById = (state, todoId) => {
  return selectTodoEntities(state)[todoId]
}

export const selectTodoIds = createSelector(
  // First, pass one or more "input selector" functions:
  selectTodos,
  // Then, an "output selector" that receives all the input results as arguments
  // and returns a final result value
  (todos) => todos.map((todo) => todo.id)
)

export const selectFilteredTodos = createSelector(
  // First input selector: all todos
  selectTodos,
  // Second input selector: all filters
  (state) => state.filters,
  // Output selector: receives both values
  (todos, filters) => {
    const { status, colors } = filters
    const showAllCompletions = status === StatusFilters.All
    if (showAllCompletions && colors.length === 0) {
      return todos
    }

    const completedStatus = status === StatusFilters.Completed
    // Return either active or completed todos based on filter
    return todos.filter((todo) => {
      const statusMatches =
        showAllCompletions || todo.completed === completedStatus
      const colorMatches = colors.length === 0 || colors.includes(todo.color)
      return statusMatches && colorMatches
    })
  }
)

export const selectFilteredTodoIds = createSelector(
  // Pass our other memoized selector as an input
  selectFilteredTodos,
  // And derive data in the output selector
  (filteredTodos) => filteredTodos.map((todo) => todo.id)
)

// Thunk function
export const fetchTodos = () => async (dispatch) => {
  dispatch(todosLoading())
  const response = await client.get('/fakeApi/todos')
  dispatch(todosLoaded(response.todos))
}

// Write a synchronous outer function that receives the `text` parameter:
export function saveNewTodo(text) {
  // And then creates and returns the async thunk function:
  return async function saveNewTodoThunk(dispatch, getState) {
    // ✅ Now we can use the text value and send it to the server
    const initialTodo = { text }
    const response = await client.post('/fakeApi/todos', { todo: initialTodo })
    dispatch(todoAdded(response.todo))
  }
}
