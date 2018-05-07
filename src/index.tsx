import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Tactical from './compo/index'

class Main extends React.Component {
  state = {
    width: 1200
  }
  render() {
    return <div style={{
      width: this.state.width,
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <button style={{width:50}} onClick={() => this.setState({ width: this.state.width + 100 })}>+</button>
        <button style={{width:50}} onClick={() => this.setState({ width: this.state.width - 100 })}>-</button>
      </div>
      <Tactical width={this.state.width}/>
    </div>
  }
}

ReactDOM.render(<Main />, document.getElementById('main'))